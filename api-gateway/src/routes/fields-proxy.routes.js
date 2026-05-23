const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

/**
 * Create proxy middleware for fields endpoints
 */
const fieldsProxy = createProxyMiddleware({
  target: process.env.CALENDAR_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/fields': '/fields',
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error('Fields proxy error:', {
      message: err.message,
      code: err.code,
      method: req.method,
      path: req.path,
    });
    res.status(503).json({
      success: false,
      message: 'Calendar service unavailable',
      error: err.message,
    });
  },
});

/**
 * All fields routes - proxied to calendar service with authentication
 */

// Get all fields - GET /api/fields
router.get('/', fieldsProxy);

// Sync all fields - POST /api/fields/sync-all
router.post('/sync-all', fieldsProxy);

// Get field by ID - GET /api/fields/:id
router.get('/:id', fieldsProxy);

// Irrigate field - POST /api/fields/:id/irrigate
router.post('/:id/irrigate', fieldsProxy);

module.exports = router;
