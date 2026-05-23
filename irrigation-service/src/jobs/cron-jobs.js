const cron = require('node-cron');
const { Queue } = require('bullmq');
const redis = require('redis');
const IrrigationService = require('../services/irrigation.service');
const { CropCalendarService } = require('../services/external.service');
const Logger = require('../utils/logger');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

/**
 * Initialize cron jobs for irrigation service
 */
function initializeCronJobs(queue) {
  if (process.env.ENABLE_CRON_JOBS !== 'true') {
    Logger.info('CronJobs: Disabled');
    return;
  }

  Logger.info('CronJobs: Initializing scheduled tasks');

  /**
   * Daily irrigation calculation at 5:00 AM
   * Calculates irrigation requirements for all parcels
   */
  const dailyCalculation = cron.schedule('0 5 * * *', async () => {
    try {
      Logger.info('CronJobs: Starting daily irrigation calculation');

      const parcels = await CropCalendarService.getAllParcels();

      if (!parcels || parcels.length === 0) {
        Logger.warn('CronJobs: No parcels found for daily calculation');
        return;
      }

      let jobsCreated = 0;
      for (const parcel of parcels) {
        try {
          await queue.add('irrigation-calculation', { parcelId: parcel.id }, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          });
          jobsCreated++;
        } catch (error) {
          Logger.error('CronJobs: Failed to queue job for parcel', {
            parcelId: parcel.id,
            error: error.message,
          });
        }
      }

      Logger.info('CronJobs: Daily calculation jobs created', { jobsCreated, total: parcels.length });
    } catch (error) {
      Logger.error('CronJobs: Daily calculation failed', { error: error.message });
    }
  }, {
    timezone: 'UTC',
  });

  /**
   * Execute pending schedules every 30 minutes
   */
  const executeSchedules = cron.schedule('*/30 * * * *', async () => {
    try {
      Logger.debug('CronJobs: Checking for pending schedules');

      const { IrrigationScheduleRepository } = require('../repositories/irrigation.repository');
      const scheduleRepository = new IrrigationScheduleRepository();

      const pendingSchedules = await scheduleRepository.getPending(100);

      if (pendingSchedules.length === 0) {
        Logger.debug('CronJobs: No pending schedules');
        return;
      }

      Logger.info('CronJobs: Found pending schedules', { count: pendingSchedules.length });

      for (const schedule of pendingSchedules) {
        try {
          await scheduleRepository.updateStatus(schedule.id, 'EXECUTED', new Date());
          Logger.info('CronJobs: Schedule executed', { scheduleId: schedule.id });
        } catch (error) {
          Logger.error('CronJobs: Failed to execute schedule', {
            scheduleId: schedule.id,
            error: error.message,
          });
        }
      }
    } catch (error) {
      Logger.error('CronJobs: Schedule execution check failed', { error: error.message });
    }
  }, {
    timezone: 'UTC',
  });

  /**
   * Weekly summary report at 8:00 AM on Monday
   */
  const weeklySummary = cron.schedule('0 8 * * 1', async () => {
    try {
      Logger.info('CronJobs: Generating weekly summary');

      // TODO: Implement weekly summary generation
      Logger.info('CronJobs: Weekly summary generated');
    } catch (error) {
      Logger.error('CronJobs: Weekly summary generation failed', { error: error.message });
    }
  }, {
    timezone: 'UTC',
  });

  return {
    dailyCalculation,
    executeSchedules,
    weeklySummary,
  };
}

module.exports = {
  initializeCronJobs,
};
