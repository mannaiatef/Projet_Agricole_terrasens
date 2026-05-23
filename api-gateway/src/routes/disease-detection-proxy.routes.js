const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const router = express.Router();
const diseaseDetectionServiceUrl = process.env.DISEASE_DETECTION_SERVICE_URL || 'http://localhost:3006';

console.log('[Disease Detection Proxy] Service URL:', diseaseDetectionServiceUrl);

/**
 * Create proxy middleware for disease detection service
 * Note: Service endpoints are /api/v1/disease/*, so no path rewrite needed
 */
const diseaseDetectionProxy = createProxyMiddleware({
  target: diseaseDetectionServiceUrl,
  changeOrigin: true,
  ws: false,
  onProxyReq: (proxyReq, req, res) => {
    // For file uploads, multer handles the body
    // For JSON bodies, pass through
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
    
    // Forward authentication headers
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    if (req.headers['x-user-id']) {
      proxyReq.setHeader('X-User-ID', req.headers['x-user-id']);
    }
  },
  onError: (err, req, res) => {
    console.error('Disease Detection Service Proxy Error:', err.message);
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Disease detection service is temporarily unavailable'
      }
    });
  },
  logLevel: 'warn'
});

/**
 * Disease Detection Service Routes
 * All endpoints use /api/v1/disease prefix
 */

// Health check - no authentication required
router.get('/health', diseaseDetectionProxy);

// Analyze image - requires authentication
// POST /api/v1/disease/analyze
router.post('/analyze', diseaseDetectionProxy);

// Get analysis history - requires authentication  
// GET /api/v1/disease/history?limit=10&offset=0
router.get('/history', diseaseDetectionProxy);

// Get single analysis - optional authentication
// GET /api/v1/disease/analysis/:analysisId
router.get('/analysis/:analysisId', diseaseDetectionProxy);

// Get analyses for a parcel - optional authentication
// GET /api/v1/disease/parcel/:parcelId
router.get('/parcel/:parcelId', diseaseDetectionProxy);

// Get disease statistics - requires authentication
// GET /api/v1/disease/statistics
router.get('/statistics', diseaseDetectionProxy);

// Get high-risk analyses - requires authentication
// GET /api/v1/disease/high-risk?confidence=80
router.get('/high-risk', diseaseDetectionProxy);

// Delete analysis - requires authentication
// DELETE /api/v1/disease/analysis/:analysisId
router.delete('/analysis/:analysisId', diseaseDetectionProxy);

module.exports = router;
