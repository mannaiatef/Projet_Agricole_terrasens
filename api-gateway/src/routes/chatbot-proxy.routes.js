const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

const chatbotServiceUrl = process.env.CHATBOT_SERVICE_URL || 'http://localhost:3006';

console.log('[Chatbot Proxy] Service URL:', chatbotServiceUrl);

// Proxy all requests to chatbot service
router.use(
  '/',
  createProxyMiddleware({
    target: chatbotServiceUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/api/chat': '/chat',
    },
    logLevel: 'debug',
    onError: (err, req, res) => {
      console.error('[Chatbot Proxy Error]:', err.message);
      res.status(503).json({
        success: false,
        message: 'Chatbot service is unavailable',
        error: err.message,
      });
    },
  })
);

module.exports = router;
