require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { initializeDatabase } = require('./config/database');
const stressRoutes = require('./routes/stress');
const healthRoutes = require('./routes/health');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { queryParams: req.query, body: req.body });
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/stress', stressRoutes);

// 404 handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist` 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    message: err.message, 
    stack: err.stack,
    path: req.path 
  });
  res.status(err.status || 500).json({ 
    error: err.name || 'Internal Server Error',
    message: err.message 
  });
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize database
    const dbReady = await initializeDatabase();
    if (!dbReady) {
      throw new Error('Database initialization failed');
    }

    logger.info('Database initialized');

    // Start HTTP server
    const PORT = process.env.PORT || 3005;
    app.listen(PORT, () => {
      logger.info(`Stress Service API running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    logger.error('Failed to start server', { message: error.message });
    process.exit(1);
  }
}

async function gracefulShutdown() {
  logger.info('Received shutdown signal');
  process.exit(0);
}

// Start if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
