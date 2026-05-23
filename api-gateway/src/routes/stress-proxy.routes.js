const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const router = express.Router();
const stressServiceUrl = process.env.STRESS_SERVICE_URL || 'http://localhost:3005';

console.log('[Stress Proxy] Service URL:', stressServiceUrl);

// Proxy for stress service API calls
const proxyMiddleware = createProxyMiddleware({
  target: stressServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/stress': '/stress',
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
    console.error('Stress Service Proxy Error:', err);
    res.status(503).json({
      success: false,
      message: 'Stress Service is unavailable',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  },
  logLevel: 'warn'
});

/**
 * Stress service endpoints - all proxied to stress microservice
 */

// GET endpoints
router.get('/queue/stats', proxyMiddleware);
router.get('/jobs/:jobId', proxyMiddleware);
router.get('/parcel/:id/map', proxyMiddleware);
router.get('/parcel/:id/map/history', proxyMiddleware);
router.get('/parcel/:id/latest', proxyMiddleware);
router.get('/parcel/:id/alerts', proxyMiddleware);
router.get('/alerts/:id', proxyMiddleware);
router.get('/:parcelId', proxyMiddleware);

// POST endpoints
router.post('/analyze', proxyMiddleware);
router.post('/analyze-bulk', proxyMiddleware);
router.post('/analyze/:parcelId', proxyMiddleware);
router.post('/bulk-analyze', proxyMiddleware);

// PUT endpoints
router.put('/alerts/:id/acknowledge', proxyMiddleware);

module.exports = router;
