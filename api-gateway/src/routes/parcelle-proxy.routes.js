const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

/**
 * Create proxy middleware for parcelle endpoints
 */
const parcelleProxy = createProxyMiddleware({
  target: process.env.CALENDAR_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/parcelles': '/parcelles',
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
    console.error('Parcelle proxy error:', {
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
 * All parcelle routes - proxied to calendar service with authentication
 */

// Get all parcelles - GET /api/parcelles
router.get('/', parcelleProxy);

// Create new parcelle - POST /api/parcelles
router.post('/', parcelleProxy);

// Assign crop to parcelle - POST /api/parcelles/:id/assign-crop (MUST come before /:id routes)
router.post('/:id/assign-crop', parcelleProxy);

// Generate calendar for parcelle - POST /api/parcelles/:id/calendar/generate
router.post('/:id/calendar/generate', parcelleProxy);

// Get parcelle by ID - GET /api/parcelles/:id
router.get('/:id', parcelleProxy);

// Update parcelle - PUT /api/parcelles/:id
router.put('/:id', parcelleProxy);

// Delete parcelle - DELETE /api/parcelles/:id
router.delete('/:id', parcelleProxy);

module.exports = router;
