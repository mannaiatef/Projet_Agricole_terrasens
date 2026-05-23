const { Worker } = require('bullmq');
const logger = require('../../utils/logger');
const StressAnalysisService = require('../../services/StressAnalysisService');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
};

/**
 * Worker for stress analysis jobs
 * Processes jobs from the 'stress-analysis' queue
 */
const stressAnalysisWorker = new Worker(
  'stress-analysis',
  async (job) => {
    try {
      logger.info('Processing stress analysis job', { jobId: job.id, parcelId: job.data.parcelId });

      // Update job progress
      await job.updateProgress(10);

      const parcelId = job.data.parcelId;

      // Execute analysis
      const result = await StressAnalysisService.analyzeParcel(parcelId);

      await job.updateProgress(100);

      logger.info('Stress analysis job completed', { 
        jobId: job.id, 
        recordId: result.recordId,
        stressPercentage: result.stressPercentage.toFixed(2)
      });

      return {
        success: true,
        recordId: result.recordId,
        parcelId: result.parcelId,
        stressPercentage: result.stressPercentage,
        zoneCount: result.zoneCount
      };
    } catch (error) {
      logger.error('Stress analysis job failed', { 
        jobId: job.id, 
        parcelId: job.data.parcelId,
        error: error.message,
        attempt: job.attemptsMade
      });

      // Re-throw to trigger retry
      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 2, // Process 2 jobs concurrently
    settings: {
      lockDuration: 30000, // 30 second lock
      lockRenewTime: 15000, // Renew every 15 seconds
      maxStalledCount: 2
    }
  }
);

// Worker event listeners
stressAnalysisWorker.on('completed', (job, result) => {
  logger.info('Worker: Job completed', { jobId: job.id, result });
});

stressAnalysisWorker.on('failed', (job, error) => {
  logger.error('Worker: Job failed', { jobId: job.id, error: error.message });
});

stressAnalysisWorker.on('error', (error) => {
  logger.error('Worker error', { message: error.message });
});

stressAnalysisWorker.on('stalled', (jobId) => {
  logger.warn('Worker: Job stalled', { jobId });
});

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down worker');
  await stressAnalysisWorker.close();
}

module.exports = {
  stressAnalysisWorker,
  shutdown
};
