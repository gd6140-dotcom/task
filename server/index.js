require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const issuesRoutes = require('./routes/issues');
const eventsRoutes = require('./routes/events');
const resourcesRoutes = require('./routes/resources');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database & Seed data
initializeDatabase();

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'CampusFlow - Second Year Engineering Challenge',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Mount REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static frontend assets if built
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Serve SPA frontend fallback
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API route not found' });
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: 'CampusFlow API Server is running. Start frontend client with "npm run client" or visit /api/health.',
      routes: ['/api/auth', '/api/issues', '/api/events', '/api/resources', '/api/analytics']
    });
  }
});

// Central Error Handler
app.use(errorHandler);

if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 CampusFlow Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
