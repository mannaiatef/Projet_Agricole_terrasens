const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

/**
 * Create proxy middleware for crop service
 */
const cropProxy = createProxyMiddleware({
  target: process.env.CROP_SERVICE_URL || 'http://127.0.0.1:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/parcelles': '/parcelles',
    '^/api/calendar': '/calendar',
  },
  onError: (err, req, res) => {
    console.error('Crop proxy error:', err.message);
    res.status(503).json({
      success: false,
      message: 'Crop service unavailable',
      error: err.message,
    });
  },
});

/**
 * All routes - proxied to crop service with authentication
 */

// Parcelles endpoints
router.get('/parcelles', cropProxy);
router.post('/parcelles', cropProxy);
router.get('/parcelles/:id', cropProxy);
router.put('/parcelles/:id', cropProxy);
router.delete('/parcelles/:id', cropProxy);

// Calendar endpoints
router.get('/calendar/:parcelleId', cropProxy);

module.exports = router;
