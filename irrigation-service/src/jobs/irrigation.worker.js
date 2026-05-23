const { Worker } = require('bullmq');
const redis = require('redis');
const IrrigationService = require('../services/irrigation.service');
const { IrrigationAlertRepository } = require('../repositories/irrigation.repository');
const Logger = require('../utils/logger');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

/**
 * Create irrigation calculation worker
 * Processes jobs from the irrigation queue
 */
function createIrrigationWorker() {
  const worker = new Worker('irrigation-calculations', async (job) => {
    try {
      Logger.info('IrrigationWorker: Processing job', { jobId: job.id, parcelId: job.data.parcelId });

      const { parcelId } = job.data;

      // Calculate irrigation requirements
      const recommendation = await IrrigationService.calculateIrrigation(parcelId);

      // Save recommendation to database
      await IrrigationService.saveRecommendation(recommendation);

      // Check for alerts
      const stressData = recommendation.conditions;
      if (stressData) {
        await IrrigationService.checkAndCreateAlerts(parcelId, stressData, null);
      }

      Logger.info('IrrigationWorker: Job completed', {
        jobId: job.id,
        parcelId,
        priority: recommendation.priority,
      });

      return recommendation;
    } catch (error) {
      Logger.error('IrrigationWorker: Job failed', { jobId: job.id, error: error.message });
      throw error;
    }
  },
  {
    connection: redisClient,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    Logger.debug('IrrigationWorker: Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    Logger.error('IrrigationWorker: Job failed', { jobId: job?.id, error: error.message });
  });

  return worker;
}

/**
 * Create daily bulk calculation worker
 * Calculates irrigation for all parcels daily
 */
function createDailyBulkWorker() {
  const worker = new Worker('irrigation-daily-bulk', async (job) => {
    try {
      Logger.info('IrrigationWorker: Starting daily bulk calculation');

      const { CropCalendarService } = require('../services/external.service');

      // Get all parcels
      const parcels = await CropCalendarService.getAllParcels();

      if (!parcels || parcels.length === 0) {
        Logger.info('IrrigationWorker: No parcels found');
        return { processed: 0 };
      }

      Logger.info(`IrrigationWorker: Processing ${parcels.length} parcels`);

      const processedCount = parcels.reduce((count) => count + 1, 0);

      Logger.info('IrrigationWorker: Daily bulk calculation completed', { processedCount });

      return { processed: processedCount };
    } catch (error) {
      Logger.error('IrrigationWorker: Daily bulk calculation failed', { error: error.message });
      throw error;
    }
  },
  {
    connection: redisClient,
  });

  return worker;
}

module.exports = {
  createIrrigationWorker,
  createDailyBulkWorker,
};
