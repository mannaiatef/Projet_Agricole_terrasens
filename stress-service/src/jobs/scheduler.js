const cron = require('node-cron');
const logger = require('../utils/logger');
const { addStressAnalysisJob } = require('./queue');
const CropCalendarClient = require('../services/CropCalendarClient');

/**
 * Scheduled tasks for the stress service
 */

let scheduledTasks = [];

/**
 * Initialize all cron jobs
 */
async function initializeScheduler() {
  try {
    logger.info('Initializing scheduler');

    // Daily stress analysis for all parcels
    const dailySchedule = process.env.CRON_SCHEDULE || '0 2 * * *'; // 2 AM daily
    scheduleParcelAnalysis(dailySchedule);

    // Periodic queue cleanup (every 6 hours)
    scheduleQueueCleanup('0 */6 * * *');

    logger.info('Scheduler initialized', { tasks: scheduledTasks.length });
  } catch (error) {
    logger.error('Failed to initialize scheduler', { message: error.message });
    throw error;
  }
}

/**
 * Schedule daily analysis of all parcels
 */
function scheduleParcelAnalysis(cronExpression) {
  const task = cron.schedule(cronExpression, async () => {
    logger.info('Starting scheduled parcel analysis', { schedule: cronExpression });

    try {
      const parcels = await CropCalendarClient.getAllParcels();
      logger.info('Queueing parcels for analysis', { count: parcels.length });

      let queued = 0;
      for (const parcel of parcels) {
        try {
          await addStressAnalysisJob(parcel.id || parcel.parcel_id, {
            priority: 'low',
            delay: queued * 5000 // Stagger jobs by 5 seconds
          });
          queued++;
        } catch (error) {
          logger.error('Failed to queue parcel', { parcelId: parcel.id, message: error.message });
        }
      }

      logger.info('Scheduled parcel analysis completed', { queued, total: parcels.length });
    } catch (error) {
      logger.error('Scheduled parcel analysis failed', { message: error.message });
    }
  });

  scheduledTasks.push({ name: 'daily-parcel-analysis', task });
  logger.info('Daily parcel analysis scheduled', { schedule: cronExpression });
}

/**
 * Schedule periodic queue cleanup
 */
function scheduleQueueCleanup(cronExpression) {
  const task = cron.schedule(cronExpression, async () => {
    logger.info('Running queue cleanup');

    try {
      const { getQueueStats } = require('./queue');
      const stats = await getQueueStats();

      logger.info('Queue statistics', { 
        waiting: stats.waiting,
        active: stats.active,
        completed: stats.completed,
        failed: stats.failed
      });

      // Optional: Archive old completed jobs, retry failed jobs, etc.
      // Implement custom cleanup logic here
    } catch (error) {
      logger.error('Queue cleanup failed', { message: error.message });
    }
  });

  scheduledTasks.push({ name: 'queue-cleanup', task });
  logger.info('Queue cleanup scheduled', { schedule: cronExpression });
}

/**
 * Stop all scheduled tasks
 */
function stopScheduler() {
  logger.info('Stopping scheduler');

  for (const { name, task } of scheduledTasks) {
    task.stop();
    logger.info('Task stopped', { name });
  }

  scheduledTasks = [];
}

/**
 * Get active scheduled tasks
 */
function getScheduledTasks() {
  return scheduledTasks.map(t => ({
    name: t.name,
    status: t.task.status
  }));
}

module.exports = {
  initializeScheduler,
  stopScheduler,
  getScheduledTasks,
  scheduleParcelAnalysis,
  scheduleQueueCleanup
};
