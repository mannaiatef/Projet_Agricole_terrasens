require('dotenv').config();

const express = require('express');
const { Queue } = require('bullmq');
const redis = require('redis');

const Logger = require('./utils/logger');
const { initializeDatabase } = require('./config/db');
const { createIrrigationWorker } = require('./jobs/irrigation.worker');
const { initializeCronJobs } = require('./jobs/cron-jobs');
const irrigationRoutes = require('./routes/irrigation.routes');

const app = express();
const PORT = process.env.SERVICE_PORT || 3004;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  Logger.debug(`${req.method} ${req.path}`, { query: req.query });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'irrigation-service',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/irrigation', irrigationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  Logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

/**
 * Initialize and start server
 */
async function startServer() {
  try {
    Logger.info('Irrigation Service initializing...');

    // Initialize database
    await initializeDatabase();

    // Setup Redis queue
    let queue = null;
    let worker = null;
    let cronJobs = null;

    if (process.env.ENABLE_QUEUE === 'true') {
      const redisClient = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      });

      queue = new Queue('irrigation-calculations', {
        connection: redisClient,
      });

      worker = createIrrigationWorker();
      Logger.info('Queue and Worker initialized');
    }

    // Initialize cron jobs
    if (process.env.ENABLE_CRON_JOBS === 'true' && queue) {
      cronJobs = initializeCronJobs(queue);
      Logger.info('Cron jobs initialized');
    }

    // Start server
    app.listen(PORT, () => {
      Logger.info(`✓ Irrigation Service is running on port ${PORT}`);
      Logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      Logger.info(`✓ Queue enabled: ${process.env.ENABLE_QUEUE === 'true'}`);
      Logger.info(`✓ Cron jobs enabled: ${process.env.ENABLE_CRON_JOBS === 'true'}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      Logger.info('Shutting down gracefully...');

      if (worker) {
        await worker.close();
      }

      if (queue) {
        await queue.close();
      }

      if (cronJobs) {
        cronJobs.dailyCalculation.stop();
        cronJobs.executeSchedules.stop();
        cronJobs.weeklySummary.stop();
      }

      process.exit(0);
    });
  } catch (error) {
    Logger.error('Failed to start service', { error: error.message });
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
