require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { initializeDatabase } = require('./config/db');
const chatRoutes = require('./routes/chat.routes');
const authMiddleware = require('./middlewares/auth.middleware');
const LLMService = require('./services/llm.service');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint (no authentication needed)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chatbot Service is running',
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint (no authentication, for debugging)
app.post('/test', express.json(), (req, res) => {
  console.log('[TEST] Test endpoint called');
  res.status(200).json({
    success: true,
    message: 'Test endpoint working',
    body: req.body,
  });
});

// Chat routes (with authentication)
app.use('/chat', authMiddleware, chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 3006;

const startServer = async () => {
  try {
    await initializeDatabase();
    console.log('✓ Database initialized successfully');

    app.listen(PORT, async () => {
      console.log(`\n🚀 Chatbot Service is running on port ${PORT}`);
      console.log(`📝 API Documentation:`);
      console.log(`   POST   /chat          - Send a message to the chatbot`);
      console.log(`   POST   /chat/image    - Upload a crop image for diagnosis`);
      console.log(`   GET    /chat/history  - Get conversation history`);
      console.log(`   GET    /health        - Health check\n`);
      
      // Warm up the model in the background
      setTimeout(() => {
        console.log('[Server] Starting LLM model warm-up...');
        LLMService.warmupModel().then(() => {
          console.log('[Server] LLM model warm-up completed');
        }).catch(err => {
          console.warn('[Server] LLM model warm-up failed:', err.message);
        });
      }, 1000);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
