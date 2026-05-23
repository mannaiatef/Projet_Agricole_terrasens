const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const router = express.Router();
const irrigationServiceUrl = process.env.IRRIGATION_SERVICE_URL || 'http://localhost:3004';

console.log('[Irrigation Proxy] Service URL:', irrigationServiceUrl);

// Proxy for irrigation service API calls
const proxyMiddleware = createProxyMiddleware({
  target: irrigationServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/irrigation': '/irrigation',
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
    console.error('Irrigation Service Proxy Error:', err);
    res.status(503).json({
      success: false,
      message: 'Irrigation Service is unavailable',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  },
  logLevel: 'warn'
});

/**
 * Irrigation service endpoints - all proxied to irrigation microservice
 */

// GET endpoints
router.get('/:parcelId', proxyMiddleware);
router.get('/history/:parcelId', proxyMiddleware);
router.get('/schedule/:parcelId', proxyMiddleware);
router.get('/reports/history/:parcelId', proxyMiddleware);
router.get('/reports/date-range/:parcelId', proxyMiddleware);

// POST endpoints
router.post('/calculate/:parcelId', proxyMiddleware);
router.post('/schedule', proxyMiddleware);
router.post('/schedule/:scheduleId/execute', proxyMiddleware);

module.exports = router;
