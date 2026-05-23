require('dotenv').config();
const logger = require('./utils/logger');
const { stressAnalysisWorker } = require('./jobs/workers/StressAnalysisWorker');
const { initializeScheduler, stopScheduler } = require('./jobs/scheduler');
const { initializeDatabase } = require('./config/database');

/**
 * Worker process for background job processing
 * This is separate from the API server
 * Start with: node worker.js
 */

async function startWorker() {
  try {
    logger.info('Starting stress-service worker');

    // Initialize database
    const dbReady = await initializeDatabase();
    if (!dbReady) {
      throw new Error('Failed to connect to database');
    }

    logger.info('Database initialized');

    // Start job worker
    logger.info('Starting job worker');
    await stressAnalysisWorker.waitUntilReady();

    // Initialize scheduler
    await initializeScheduler();

    logger.info('Stress-service worker started successfully');

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    logger.error('Failed to start worker', { message: error.message });
    process.exit(1);
  }
}

async function gracefulShutdown() {
  logger.info('Received shutdown signal, gracefully shutting down');

  try {
    stopScheduler();
    await stressAnalysisWorker.close();
    logger.info('Worker shut down successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { message: error.message });
    process.exit(1);
  }
}

startWorker();
