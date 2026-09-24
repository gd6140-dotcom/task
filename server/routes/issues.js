const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const VALID_STATUSES = ['submitted', 'assigned', 'in_progress', 'resolved', 'reopened'];
const VALID_CATEGORIES = ['infrastructure', 'academic', 'hostel', 'cafeteria', 'library', 'it_support', 'other'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// GET /api/issues - Search, filter, paginate, sort
router.get('/', authenticate, (req, res, next) => {
  try {
    const {
      q = '',
      status = '',
      category = '',
      priority = '',
      myIssues = 'false',
      assignedToMe = 'false',
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      order = 'DESC'
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (parsedPage - 1) * parsedLimit;

    let queryConditions = ['1=1'];
    let queryParams = [];

    if (q.trim()) {
      queryConditions.push('(title LIKE ? OR description LIKE ? OR location LIKE ?)');
      const searchTerm = `%${q.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status && VALID_STATUSES.includes(status)) {
      queryConditions.push('status = ?');
      queryParams.push(status);
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      queryConditions.push('category = ?');
      queryParams.push(category);
    }

    if (priority && VALID_PRIORITIES.includes(priority)) {
      queryConditions.push('priority = ?');
      queryParams.push(priority);
    }

    if (myIssues === 'true') {
      queryConditions.push('student_id = ?');
      queryParams.push(req.user.id);
    }

    if (assignedToMe === 'true') {
      queryConditions.push('assigned_to_id = ?');
      queryParams.push(req.user.id);
    }

    const whereClause = queryConditions.join(' AND ');
    const allowedSortFields = ['created_at', 'updated_at', 'priority', 'status', 'title'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count total records
    const countSql = `SELECT COUNT(*) as total FROM issues WHERE ${whereClause}`;
    const total = db.prepare(countSql).get(...queryParams).total;

    // Fetch paginated records
    const fetchSql = `
      SELECT i.*, 
        (SELECT COUNT(*) FROM issue_comments WHERE issue_id = i.id) as comment_count
      FROM issues i
      WHERE ${whereClause}
      ORDER BY ${safeSortBy} ${safeOrder}
      LIMIT ? OFFSET ?
    `;
    const issues = db.prepare(fetchSql).all(...queryParams, parsedLimit, offset);

    res.json({
      success: true,
      data: issues,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/issues/stats/overview - Aggregated metrics
router.get('/stats/overview', authenticate, (req, res, next) => {
  try {
    const totalIssues = db.prepare('SELECT COUNT(*) as count FROM issues').get().count;
    const submittedCount = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status = 'submitted'").get().count;
    const inProgressCount = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status IN ('assigned', 'in_progress')").get().count;
    const resolvedCount = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status = 'resolved'").get().count;
    const reopenedCount = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status = 'reopened'").get().count;

    const byCategory = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM issues 
      GROUP BY category 
      ORDER BY count DESC
    `).all();

    const byPriority = db.prepare(`
      SELECT priority, COUNT(*) as count 
      FROM issues 
      GROUP BY priority
    `).all();

    const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM issues 
      GROUP BY status
    `).all();

    // Calculate resolution rate
    const resolutionRate = totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0;

    res.json({
      success: true,
      stats: {
        total: totalIssues,
        submitted: submittedCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        reopened: reopenedCount,
        resolutionRate,
        byCategory,
        byPriority,
        byStatus
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/issues/:id - Issue detail with comments history
router.get('/:id', authenticate, (req, res, next) => {
  try {
    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found.' });
    }

    const comments = db.prepare(`
      SELECT * FROM issue_comments 
      WHERE issue_id = ? 
      ORDER BY created_at ASC
    `).all(req.params.id);

    res.json({
      success: true,
      issue,
      comments
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/issues - Create a new issue (Student or Admin)
router.post('/', authenticate, (req, res, next) => {
  try {
    const { title, description, category, priority = 'medium', location, image_url = null } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({ success: false, error: 'Title, description, category, and location are required.' });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    const insertStmt = db.prepare(`
      INSERT INTO issues (title, description, category, priority, status, location, student_id, student_name, image_url)
      VALUES (?, ?, ?, ?, 'submitted', ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      title.trim(),
      description.trim(),
      category,
      priority,
      location.trim(),
      req.user.id,
      req.user.name,
      image_url ? image_url.trim() : null
    );

    const newIssueId = result.lastInsertRowid;

    // Create initial audit log comment
    db.prepare(`
      INSERT INTO issue_comments (issue_id, user_id, user_name, user_role, content, status_change)
      VALUES (?, ?, ?, ?, ?, 'submitted')
    `).run(newIssueId, req.user.id, req.user.name, req.user.role, 'Issue created and submitted for triage.');

    const createdIssue = db.prepare('SELECT * FROM issues WHERE id = ?').get(newIssueId);

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully!',
      issue: createdIssue
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/issues/:id/status - Transition issue workflow status
router.patch('/:id/status', authenticate, (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, assigned_to_id } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found.' });
    }

    // Authorization check:
    // Students can only reopen their own resolved issues
    if (req.user.role === 'student') {
      if (status !== 'reopened') {
        return res.status(403).json({ success: false, error: 'Students can only reopen their own resolved issues.' });
      }
      if (issue.student_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'You can only reopen issues created by you.' });
      }
      if (issue.status !== 'resolved') {
        return res.status(400).json({ success: false, error: 'Only resolved issues can be reopened.' });
      }
    }

    let assignedId = issue.assigned_to_id;
    let assignedName = issue.assigned_to_name;

    if (assigned_to_id) {
      const assignedUser = db.prepare('SELECT id, name FROM users WHERE id = ?').get(assigned_to_id);
      if (assignedUser) {
        assignedId = assignedUser.id;
        assignedName = assignedUser.name;
      }
    }

    const resolvedAt = status === 'resolved' ? new Date().toISOString() : (status === 'reopened' ? null : issue.resolved_at);

    db.prepare(`
      UPDATE issues 
      SET status = ?, 
          assigned_to_id = ?, 
          assigned_to_name = ?, 
          resolved_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, assignedId, assignedName, resolvedAt, id);

    // Add status transition comment
    const commentContent = note && note.trim()
      ? note.trim()
      : `Status changed from ${issue.status.toUpperCase()} to ${status.toUpperCase()}${assignedName ? ` (Assigned to: ${assignedName})` : ''}.`;

    db.prepare(`
      INSERT INTO issue_comments (issue_id, user_id, user_name, user_role, content, status_change)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, req.user.name, req.user.role, commentContent, status);

    const updatedIssue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    const comments = db.prepare('SELECT * FROM issue_comments WHERE issue_id = ? ORDER BY created_at ASC').all(id);

    res.json({
      success: true,
      message: `Issue status updated to ${status}`,
      issue: updatedIssue,
      comments
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/issues/:id/comments - Add comment
router.post('/:id/comments', authenticate, (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Comment message is required.' });
    }

    const issue = db.prepare('SELECT id FROM issues WHERE id = ?').get(id);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found.' });
    }

    db.prepare(`
      INSERT INTO issue_comments (issue_id, user_id, user_name, user_role, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.user.id, req.user.name, req.user.role, content.trim());

    // Update issue updated_at timestamp
    db.prepare('UPDATE issues SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    const comments = db.prepare('SELECT * FROM issue_comments WHERE issue_id = ? ORDER BY created_at ASC').all(id);

    res.status(201).json({
      success: true,
      message: 'Comment added.',
      comments
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/issues/:id - Update issue details
router.put('/:id', authenticate, (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, location, image_url } = req.body;

    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found.' });
    }

    // Only owner or admin/staff can update
    if (req.user.role === 'student' && issue.student_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You are not authorized to edit this issue.' });
    }

    db.prepare(`
      UPDATE issues 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          priority = COALESCE(?, priority),
          location = COALESCE(?, location),
          image_url = COALESCE(?, image_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      description ? description.trim() : null,
      category || null,
      priority || null,
      location ? location.trim() : null,
      image_url !== undefined ? image_url : null,
      id
    );

    const updatedIssue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Issue details updated.',
      issue: updatedIssue
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/issues/:id - Delete issue (Admin or Owner)
router.delete('/:id', authenticate, (req, res, next) => {
  try {
    const { id } = req.params;
    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);

    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found.' });
    }

    if (req.user.role === 'student' && issue.student_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this issue.' });
    }

    db.prepare('DELETE FROM issues WHERE id = ?').run(id);

    res.json({
      success: true,
      message: 'Issue deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
