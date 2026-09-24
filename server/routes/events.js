const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const VALID_CATEGORIES = ['academic', 'cultural', 'sports', 'technical', 'workshop', 'career'];

// GET /api/events - List events with registrations and filters
router.get('/', authenticate, (req, res, next) => {
  try {
    const { category, q, myRegistered, upcomingOnly } = req.query;

    let conditions = ['1=1'];
    let params = [];

    if (q && q.trim()) {
      conditions.push('(title LIKE ? OR description LIKE ? OR organizer LIKE ? OR location LIKE ?)');
      const term = `%${q.trim()}%`;
      params.push(term, term, term, term);
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (upcomingOnly === 'true') {
      conditions.push("event_date >= date('now')");
    }

    const whereClause = conditions.join(' AND ');

    const events = db.prepare(`
      SELECT e.*,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registered_count,
        EXISTS(SELECT 1 FROM event_registrations WHERE event_id = e.id AND user_id = ?) as is_user_registered
      FROM events e
      WHERE ${whereClause}
      ORDER BY event_date ASC, start_time ASC
    `).all(req.user.id, ...params);

    const filteredEvents = myRegistered === 'true' 
      ? events.filter(e => e.is_user_registered === 1)
      : events;

    res.json({
      success: true,
      data: filteredEvents
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id - Event detail with attendees (if admin/staff)
router.get('/:id', authenticate, (req, res, next) => {
  try {
    const event = db.prepare(`
      SELECT e.*,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registered_count,
        EXISTS(SELECT 1 FROM event_registrations WHERE event_id = e.id AND user_id = ?) as is_user_registered
      FROM events e
      WHERE e.id = ?
    `).get(req.user.id, req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found.' });
    }

    const attendees = db.prepare(`
      SELECT id, user_id, user_name, user_email, registered_at 
      FROM event_registrations 
      WHERE event_id = ? 
      ORDER BY registered_at DESC
    `).all(req.params.id);

    res.json({
      success: true,
      event,
      attendees: req.user.role !== 'student' ? attendees : []
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/events - Create new event (Admin or Staff)
router.post('/', authenticate, authorizeRoles('admin', 'staff'), (req, res, next) => {
  try {
    const { title, description, category, organizer, location, event_date, start_time, end_time, capacity = 50, banner_url } = req.body;

    if (!title || !description || !category || !organizer || !location || !event_date || !start_time || !end_time) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    const result = db.prepare(`
      INSERT INTO events (title, description, category, organizer, location, event_date, start_time, end_time, capacity, banner_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      description.trim(),
      category,
      organizer.trim(),
      location.trim(),
      event_date,
      start_time,
      end_time,
      parseInt(capacity, 10) || 50,
      banner_url || null,
      req.user.id
    );

    const newEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Campus event published successfully!',
      event: newEvent
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:id/register - RSVP for event
router.post('/:id/register', authenticate, (req, res, next) => {
  try {
    const event = db.prepare(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registered_count
      FROM events e 
      WHERE e.id = ?
    `).get(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found.' });
    }

    if (event.registered_count >= event.capacity) {
      return res.status(400).json({ success: false, error: 'Event capacity is full!' });
    }

    const alreadyRegistered = db.prepare('SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?').get(event.id, req.user.id);
    if (alreadyRegistered) {
      return res.status(400).json({ success: false, error: 'You are already registered for this event.' });
    }

    db.prepare(`
      INSERT INTO event_registrations (event_id, user_id, user_name, user_email)
      VALUES (?, ?, ?, ?)
    `).run(event.id, req.user.id, req.user.name, req.user.email);

    res.json({
      success: true,
      message: `Successfully registered for ${event.title}!`
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id/register - Cancel RSVP
router.delete('/:id/register', authenticate, (req, res, next) => {
  try {
    const result = db.prepare('DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Registration not found.' });
    }

    res.json({
      success: true,
      message: 'RSVP registration cancelled.'
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id - Delete event (Admin only)
router.delete('/:id', authenticate, authorizeRoles('admin'), (req, res, next) => {
  try {
    const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Event not found.' });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
