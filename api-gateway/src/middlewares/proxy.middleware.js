const express = require('express');

/**
 * Middleware to handle auth service proxy requests
 * Properly buffers request body before proxying
 */
const createAuthProxyMiddleware = (authProxy) => {
  return (req, res) => {
    // The body should already be parsed by express.json() middleware
    // Forward the request to the proxy
    authProxy.web(req, res, (err) => {
      if (err) {
        console.error('Proxy error:', err.message);
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            message: 'Service unavailable. Please try again later.',
          });
        }
      }
    });
  };
};

module.exports = createAuthProxyMiddleware;
