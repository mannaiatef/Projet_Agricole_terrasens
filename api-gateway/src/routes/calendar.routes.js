const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

/**
 * Create proxy middleware for crops service
 */
const cropsProxy = createProxyMiddleware({
  target: process.env.CALENDAR_SERVICE_URL || 'http://127.0.0.1:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/crops': '/crops',
  },
  onError: (err, req, res) => {
    console.error('Crops proxy error:', err.message);
    res.status(503).json({
      success: false,
      message: 'Calendar service unavailable',
      error: err.message,
    });
  },
});

/**
 * Public routes - All crops endpoints
 */

// Get all crops - GET /api/crops
router.get('/', cropsProxy);

// Get crop by ID with stages and actions - GET /api/crops/:id
router.get('/:id', cropsProxy);

module.exports = router;

