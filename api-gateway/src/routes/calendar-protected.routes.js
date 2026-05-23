const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Create calendar proxy for /api/calendar/* routes
 */
const calendarProxy = createProxyMiddleware({
  target: process.env.CALENDAR_SERVICE_URL || 'http://127.0.0.1:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/calendar': '/calendar',
  },
  onError: (err, req, res) => {
    console.error('Calendar proxy error:', err.message);
    res.status(503).json({
      success: false,
      message: 'Calendar service unavailable',
      error: err.message,
    });
  },
});

/**
 * Protected routes - authentication required
 */

// Generate calendar - POST /api/calendar/generate
router.post('/generate', authMiddleware, calendarProxy);

// Get calendars for a parcelle - GET /api/calendar/parcelle/:parcelle_id
router.get('/parcelle/:parcelle_id', authMiddleware, calendarProxy);

// Get calendar by ID - GET /api/calendar/:id
router.get('/:id', authMiddleware, calendarProxy);

module.exports = router;

