const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// GET /api/resources - List resources with optional category/status filter
router.get('/', authenticate, (req, res, next) => {
  try {
    const { category, status, q } = req.query;

    let conditions = ['1=1'];
    let params = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (status) {
      conditions.push('availability_status = ?');
      params.push(status);
    }

    if (q && q.trim()) {
      conditions.push('(name LIKE ? OR description LIKE ? OR location LIKE ?)');
      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.join(' AND ');
    const resources = db.prepare(`SELECT * FROM resources WHERE ${whereClause} ORDER BY name ASC`).all(...params);

    res.json({
      success: true,
      data: resources
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/resources/bookings/all - Admin view of all reservation requests
router.get('/bookings/all', authenticate, authorizeRoles('admin', 'staff'), (req, res, next) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*, u.email as user_email, u.department as user_department
      FROM resource_bookings b
      JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
    `).all();

    res.json({
      success: true,
      data: bookings
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/resources/bookings/my - Student view of their own reservations
router.get('/bookings/my', authenticate, (req, res, next) => {
  try {
    const bookings = db.prepare(`
      SELECT * FROM resource_bookings 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({
      success: true,
      data: bookings
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/resources/:id/book - Reserve a resource
router.post('/:id/book', authenticate, (req, res, next) => {
  try {
    const { start_time, end_time, purpose } = req.body;
    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found.' });
    }

    if (resource.availability_status === 'maintenance') {
      return res.status(400).json({ success: false, error: 'Resource is currently under maintenance.' });
    }

    if (!start_time || !end_time || !purpose) {
      return res.status(400).json({ success: false, error: 'Start time, end time, and booking purpose are required.' });
    }

    const result = db.prepare(`
      INSERT INTO resource_bookings (resource_id, resource_name, user_id, user_name, start_time, end_time, purpose, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(resource.id, resource.name, req.user.id, req.user.name, start_time, end_time, purpose.trim());

    const newBooking = db.prepare('SELECT * FROM resource_bookings WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Booking request submitted for approval.',
      booking: newBooking
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/resources/bookings/:bookingId/status - Approve or reject booking (Admin/Staff)
router.patch('/bookings/:bookingId/status', authenticate, authorizeRoles('admin', 'staff'), (req, res, next) => {
  try {
    const { status, admin_notes } = req.body;
    const { bookingId } = req.params;

    if (!['approved', 'rejected', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid booking status.' });
    }

    const booking = db.prepare('SELECT * FROM resource_bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }

    db.prepare(`
      UPDATE resource_bookings 
      SET status = ?, admin_notes = ? 
      WHERE id = ?
    `).run(status, admin_notes || null, bookingId);

    const updated = db.prepare('SELECT * FROM resource_bookings WHERE id = ?').get(bookingId);

    res.json({
      success: true,
      message: `Booking has been ${status}.`,
      booking: updated
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/resources - Create resource (Admin only)
router.post('/', authenticate, authorizeRoles('admin'), (req, res, next) => {
  try {
    const { name, category, description, location, max_duration_hours = 4, image_url } = req.body;

    if (!name || !category || !description || !location) {
      return res.status(400).json({ success: false, error: 'Name, category, description, and location are required.' });
    }

    const result = db.prepare(`
      INSERT INTO resources (name, category, description, location, max_duration_hours, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), category, description.trim(), location.trim(), parseInt(max_duration_hours, 10) || 4, image_url || null);

    const newRes = db.prepare('SELECT * FROM resources WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Resource added to campus registry.',
      resource: newRes
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
