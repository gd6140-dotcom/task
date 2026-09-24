const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', (req, res, next) => {
  try {
    const { name, email, password, role = 'student', department = 'Computer Science' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    if (!['student', 'admin', 'staff'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Role must be student, staff, or admin.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, department, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), email.toLowerCase().trim(), passwordHash, role, department.trim(), defaultAvatar);

    const newUser = db.prepare('SELECT id, name, email, role, department, avatar_url, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: newUser
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatar_url: user.avatar_url,
      created_at: user.created_at
    };

    const token = generateToken(userPayload);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: userPayload
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/demo-login (Quick 1-click role switcher)
router.post('/demo-login', (req, res, next) => {
  try {
    const { role = 'student' } = req.body;
    let user = db.prepare('SELECT id, name, email, role, department, avatar_url, created_at FROM users WHERE role = ? LIMIT 1').get(role);

    if (!user) {
      user = db.prepare('SELECT id, name, email, role, department, avatar_url, created_at FROM users LIMIT 1').get();
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: `Demo logged in as ${user.role} (${user.name})`,
      token,
      user
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// GET /api/auth/staff-members (List staff/admin for assignment)
router.get('/staff-members', authenticate, (req, res) => {
  const staffList = db.prepare("SELECT id, name, email, role, department FROM users WHERE role IN ('admin', 'staff')").all();
  res.json({ success: true, staff: staffList });
});

module.exports = router;
