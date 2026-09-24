const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// GET /api/analytics/summary - Full campus operations metrics (Admin / Staff)
router.get('/summary', authenticate, (req, res, next) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalIssues = db.prepare('SELECT COUNT(*) as count FROM issues').get().count;
    const resolvedIssues = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status = 'resolved'").get().count;
    const activeIssues = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status IN ('submitted', 'assigned', 'in_progress', 'reopened')").get().count;
    const urgentIssues = db.prepare("SELECT COUNT(*) as count FROM issues WHERE priority = 'urgent' AND status != 'resolved'").get().count;

    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
    const totalRegistrations = db.prepare('SELECT COUNT(*) as count FROM event_registrations').get().count;

    const totalResources = db.prepare('SELECT COUNT(*) as count FROM resources').get().count;
    const pendingBookings = db.prepare("SELECT COUNT(*) as count FROM resource_bookings WHERE status = 'pending'").get().count;

    // Issue status distribution
    const statusBreakdown = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM issues 
      GROUP BY status
    `).all();

    // Issue category distribution
    const categoryBreakdown = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM issues 
      GROUP BY category
      ORDER BY count DESC
    `).all();

    // Issue priority distribution
    const priorityBreakdown = db.prepare(`
      SELECT priority, COUNT(*) as count 
      FROM issues 
      GROUP BY priority
    `).all();

    // Department issue distribution
    const departmentStats = db.prepare(`
      SELECT u.department, COUNT(i.id) as total_issues,
             SUM(CASE WHEN i.status = 'resolved' THEN 1 ELSE 0 END) as resolved_issues
      FROM users u
      LEFT JOIN issues i ON u.id = i.student_id
      WHERE u.role = 'student'
      GROUP BY u.department
      HAVING total_issues > 0
    `).all();

    // Recent activity log (latest comments and status changes)
    const recentActivity = db.prepare(`
      SELECT ic.*, i.title as issue_title
      FROM issue_comments ic
      JOIN issues i ON ic.issue_id = i.id
      ORDER BY ic.created_at DESC
      LIMIT 8
    `).all();

    res.json({
      success: true,
      data: {
        kpis: {
          totalUsers,
          totalIssues,
          resolvedIssues,
          activeIssues,
          urgentIssues,
          resolutionRate: totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0,
          totalEvents,
          totalRegistrations,
          totalResources,
          pendingBookings
        },
        statusBreakdown,
        categoryBreakdown,
        priorityBreakdown,
        departmentStats,
        recentActivity
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
