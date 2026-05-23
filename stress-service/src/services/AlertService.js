const logger = require('../utils/logger');
const AlertRepository = require('../repositories/AlertRepository');

/**
 * Alert service for handling stress alerts
 * Can be extended with webhooks, email, SMS, etc.
 */
class AlertService {
  /**
   * Send alert notification (can be overridden with actual implementations)
   */
  async sendAlert(alert) {
    try {
      // Log alert
      logger.warn('ALERT: High vegetation stress detected', {
        parcelId: alert.parcelId,
        stressPercentage: alert.stressPercentage,
        severity: alert.severity
      });

      // TODO: Implement actual alert channels:
      // - Webhook to external service
      // - Email notification
      // - SMS notification
      // - Push notification
      // - Dashboard notification

      this._logAlertToFile(alert);
    } catch (error) {
      logger.error('Failed to send alert', { message: error.message });
    }
  }

  /**
   * Get all active alerts for a parcel
   */
  async getParcelAlerts(parcelId) {
    try {
      return await AlertRepository.getActiveAlerts(parcelId);
    } catch (error) {
      logger.error('Failed to fetch parcel alerts', { parcelId, message: error.message });
      throw error;
    }
  }

  /**
   * Acknowledge an alert (mark as resolved)
   */
  async acknowledgeAlert(alertId) {
    try {
      await AlertRepository.resolveAlert(alertId);
      logger.info('Alert acknowledged', { alertId });
    } catch (error) {
      logger.error('Failed to acknowledge alert', { alertId, message: error.message });
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(parcelId) {
    try {
      const unresolved = await AlertRepository.getUnresolvedCount(parcelId);
      const allAlerts = await AlertRepository.getActiveAlerts(parcelId);

      const bySeverity = {
        high: allAlerts.filter(a => a.severity === 'high').length,
        medium: allAlerts.filter(a => a.severity === 'medium').length,
        low: allAlerts.filter(a => a.severity === 'low').length
      };

      return {
        totalUnresolved: unresolved,
        bySeverity,
        lastAlert: allAlerts[0] || null
      };
    } catch (error) {
      logger.error('Failed to get alert stats', { parcelId, message: error.message });
      throw error;
    }
  }

  /**
   * Resolve all alerts for a parcel
   */
  async resolveParcelAlerts(parcelId) {
    try {
      await AlertRepository.resolveAlertsByParcelId(parcelId);
      logger.info('All parcel alerts resolved', { parcelId });
    } catch (error) {
      logger.error('Failed to resolve parcel alerts', { parcelId, message: error.message });
      throw error;
    }
  }

  /**
   * Log alert to file (future: can send to external service)
   */
  _logAlertToFile(alert) {
    const alertLog = {
      timestamp: new Date().toISOString(),
      parcelId: alert.parcelId,
      recordId: alert.recordId,
      severity: alert.severity,
      message: alert.message,
      stressPercentage: alert.stressPercentage
    };

    logger.warn('ALERT_LOG', alertLog);
  }

  /**
   * Create webhook notification (example implementation)
   */
  async sendWebhookAlert(alert, webhookUrl) {
    try {
      const axios = require('axios');

      await axios.post(webhookUrl, {
        eventType: 'stress_alert',
        parcelId: alert.parcelId,
        severity: alert.severity,
        stressPercentage: alert.stressPercentage,
        message: alert.message,
        timestamp: new Date().toISOString()
      }, {
        timeout: 5000
      });

      logger.info('Webhook alert sent', { url: webhookUrl });
    } catch (error) {
      logger.error('Failed to send webhook alert', { message: error.message });
      // Don't throw - webhook failure shouldn't block the service
    }
  }
}

module.exports = new AlertService();
