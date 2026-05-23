const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

/**
 * Create auth proxy middleware
 * Receives raw body stream (before body parsing)
 * Forwards directly to auth service
 */
const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/auth', // Rewrite /api/auth/login to /auth/login
  },
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('Auth Proxy Error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: 'Auth service is temporarily unavailable',
        error: err.message,
      });
    }
  },
});

/**
 * Apply proxy to all requests under this router
 * Body is raw (not parsed) so proxy can stream it naturally
 */
router.use(authProxy);

module.exports = router;
