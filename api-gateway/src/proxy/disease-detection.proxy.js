const httpProxy = require('http-proxy');

/**
 * Create proxy to Disease Detection Service with proper request handling
 */
const diseaseDetectionProxy = httpProxy.createProxyServer({
  target: process.env.DISEASE_DETECTION_SERVICE_URL || 'http://localhost:3006',
  changeOrigin: true,
  timeout: 180000, // 3 minutes for AI processing (increased from 120s)
  proxyTimeout: 180000,
});

/**
 * Handle proxy errors
 */
diseaseDetectionProxy.on('error', (err, req, res) => {
  console.error('Disease Detection Proxy error:', err.message);
  if (!res.headersSent) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Disease detection service is temporarily unavailable'
      }
    });
  }
});

/**
 * Handle proxy response
 */
diseaseDetectionProxy.on('proxyRes', (proxyRes, req, res) => {
  proxyRes.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
});

module.exports = diseaseDetectionProxy;
