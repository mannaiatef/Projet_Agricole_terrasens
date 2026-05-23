const httpProxy = require('http-proxy');

/**
 * Create proxy to Auth Service with proper request handling
 */
const authProxy = httpProxy.createProxyServer({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  timeout: 60000,
  proxyTimeout: 60000,
});

/**
 * Handle proxy errors
 */
authProxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  if (!res.headersSent) {
    res.status(503).json({
      success: false,
      message: 'Auth service is temporarily unavailable',
    });
  }
});

/**
 * Handle proxy response
 */
authProxy.on('proxyRes', (proxyRes, req, res) => {
  proxyRes.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
});

module.exports = authProxy;
