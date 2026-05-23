const logger = require('../utils/logger');
const { initializeDatabase } = require('../config/database');
const { getQueueStats } = require('../jobs/queue');
const { getScheduledTasks } = require('../jobs/scheduler');

class HealthController {
  /**
   * GET /health
   * Basic health check
   */
  healthCheck = async (req, res) => {
    try {
      res.json({
        status: 'ok',
        service: 'stress-service',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  };

  /**
   * GET /health/detailed
   * Detailed health check with system status
   */
  detailedHealth = async (req, res) => {
    try {
      const dbStatus = await this._checkDatabase();
      const queueStats = await this._getQueueStats();
      const scheduledTasks = getScheduledTasks();

      res.json({
        status: dbStatus ? 'healthy' : 'degraded',
        service: 'stress-service',
        timestamp: new Date().toISOString(),
        components: {
          database: {
            status: dbStatus ? 'connected' : 'disconnected'
          },
          queue: {
            status: 'operational',
            stats: queueStats
          },
          scheduler: {
            status: scheduledTasks.length > 0 ? 'active' : 'inactive',
            tasks: scheduledTasks.length
          }
        }
      });
    } catch (error) {
      logger.error('Detailed health check failed', { message: error.message });
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  };

  /**
   * GET /health/ready
   * Kubernetes readiness probe
   */
  readinessProbe = async (req, res) => {
    try {
      const dbStatus = await this._checkDatabase();
      const queueStats = await this._getQueueStats();

      if (!dbStatus) {
        return res.status(503).json({
          ready: false,
          message: 'Database not connected'
        });
      }

      res.json({
        ready: true,
        message: 'Service ready to accept traffic'
      });
    } catch (error) {
      res.status(503).json({
        ready: false,
        message: error.message
      });
    }
  };

  /**
   * GET /health/live
   * Kubernetes liveness probe
   */
  livenessProbe = async (req, res) => {
    try {
      res.json({
        alive: true,
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(500).json({
        alive: false,
        message: error.message
      });
    }
  };

  // Private helper methods

  async _checkDatabase() {
    try {
      return await initializeDatabase();
    } catch (error) {
      logger.error('Database health check failed', { message: error.message });
      return false;
    }
  }

  async _getQueueStats() {
    try {
      return await getQueueStats();
    } catch (error) {
      logger.error('Queue stats fetch failed', { message: error.message });
      return null;
    }
  }
}

module.exports = new HealthController();
