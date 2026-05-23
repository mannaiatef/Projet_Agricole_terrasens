const { Queue, Worker, Connection } = require('bullmq');
const logger = require('../utils/logger');

// Development mode: use in-memory mock queue instead of Redis
class MockQueue {
  constructor(name) {
    this.name = name;
    this.jobs = new Map();
    this.jobCounter = 0;
    this.listeners = {};
  }

  async add(name, data, opts = {}) {
    const jobId = opts.jobId || `job-${++this.jobCounter}`;
    const job = {
      id: jobId,
      name,
      data,
      state: 'processing',
      progress: () => 100,
      getState: async () => 'completed',
      createdAt: new Date(),
      processedOn: new Date(),
      finishedOn: new Date(),
      attemptsMade: 0,
      opts: { attempts: 3 },
      updateProgress: async () => {}
    };
    
    this.jobs.set(jobId, job);
    logger.info(`[Dev Mock] Job queued: ${jobId}`, { name, parcelId: data.parcelId });
    
    // Auto-process in development mode
    setImmediate(() => this._processJobAsync(jobId, name, data));
    
    return job;
  }

  async _processJobAsync(jobId, jobName, jobData) {
    try {
      // Import here to avoid circular dependency
      const StressAnalysisService = require('../services/StressAnalysisService');
      
      logger.info(`[Dev Mock] Processing job: ${jobId}`, { parcelId: jobData.parcelId });
      
      // Execute analysis
      const result = await StressAnalysisService.analyzeParcel(jobData.parcelId);
      
      logger.info(`[Dev Mock] Job completed: ${jobId}`, { 
        parcelId: jobData.parcelId,
        recordId: result.recordId,
        stressPercentage: result.stressPercentage.toFixed(2)
      });
      
      // Update job record
      const job = this.jobs.get(jobId);
      if (job) {
        job.state = 'completed';
        job.finishedOn = new Date();
      }
    } catch (error) {
      logger.error(`[Dev Mock] Job failed: ${jobId}`, { error: error.message });
      const job = this.jobs.get(jobId);
      if (job) {
        job.state = 'failed';
        job.failedReason = error.message;
      }
    }
  }

  async getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  on(event, handler) {
    // Mock event emitter - silently ignore events
    return this;
  }
}

// Use mock queue for development to avoid Redis dependency
const stressAnalysisQueue = process.env.NODE_ENV === 'development' || !process.env.REDIS_HOST
  ? new MockQueue('stress-analysis')
  : (() => {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        maxRetriesPerRequest: null,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      };

      const queue = new Queue('stress-analysis', {
        connection: redisConfig,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: {
            age: 3600 // Keep for 1 hour
          }
        }
      });

      queue.on('error', (error) => {
        logger.error('Queue error', { message: error.message });
      });

      return queue;
    })();

// Event listeners - suppress errors in development
stressAnalysisQueue.on('error', (error) => {
  if (process.env.NODE_ENV !== 'development') {
    logger.error('Queue error', { message: error.message });
  }
});

stressAnalysisQueue.on('waiting', (job) => {
  logger.info('Job waiting', { jobId: job.id, name: job.name });
});

stressAnalysisQueue.on('active', (job) => {
  logger.info('Job started', { jobId: job.id, name: job.name });
});

stressAnalysisQueue.on('completed', (job) => {
  logger.info('Job completed', { jobId: job.id, name: job.name });
});

stressAnalysisQueue.on('failed', (job, error) => {
  logger.error('Job failed', { jobId: job.id, name: job.name, message: error.message });
});

/**
 * Add a stress analysis job to the queue
 * @param {number} parcelId - ID of parcel to analyze
 * @param {Object} options - Job options
 */
async function addStressAnalysisJob(parcelId, options = {}) {
  try {
    const job = await stressAnalysisQueue.add(
      'analyze-stress',
      { parcelId },
      {
        jobId: `${parcelId}-${Date.now()}`,
        ...options
      }
    );

    logger.info('Stress analysis job added to queue', { jobId: job.id, parcelId });
    return job;
  } catch (error) {
    logger.error('Failed to add job to queue', { parcelId, message: error.message });
    throw error;
  }
}

/**
 * Get job status
 */
async function getJobStatus(jobId) {
  try {
    const job = await stressAnalysisQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      status: await job.getState(),
      progress: job.progress(),
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      createdAt: job.createdAt,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    };
  } catch (error) {
    logger.error('Failed to get job status', { jobId, message: error.message });
    throw error;
  }
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  try {
    const counts = await stressAnalysisQueue.getJobCounts(
      'wait',
      'active',
      'completed',
      'failed',
      'paused'
    );

    return {
      waiting: counts.wait,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      paused: counts.paused
    };
  } catch (error) {
    logger.error('Failed to get queue stats', { message: error.message });
    throw error;
  }
}

/**
 * Clear all jobs from queue
 */
async function clearQueue() {
  try {
    await stressAnalysisQueue.drain();
    logger.info('Queue cleared');
  } catch (error) {
    logger.error('Failed to clear queue', { message: error.message });
    throw error;
  }
}

module.exports = {
  stressAnalysisQueue,
  addStressAnalysisJob,
  getJobStatus,
  getQueueStats,
  clearQueue
};
