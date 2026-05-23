const { pool } = require('../config/database');
const logger = require('../utils/logger');

class AlertRepository {
  async create(parcelId, recordId, alert) {
    try {
      const query = `
        INSERT INTO stress_alerts (record_id, parcel_id, alert_type, severity, message)
        VALUES (?, ?, ?, ?, ?)
      `;
      const [result] = await pool.execute(query, [
        recordId,
        parcelId,
        alert.alertType || 'stress_detected',
        alert.severity || 'medium',
        alert.message
      ]);
      
      logger.info(`Alert created`, { alertId: result.insertId, parcelId, recordId });
      return { id: result.insertId, ...alert };
    } catch (error) {
      logger.error('Failed to create alert', { parcelId, message: error.message });
      throw error;
    }
  }

  async getActiveAlerts(parcelId) {
    try {
      const query = `
        SELECT * FROM stress_alerts
        WHERE parcel_id = ? AND is_resolved = FALSE
        ORDER BY created_at DESC
      `;
      const [rows] = await pool.execute(query, [parcelId]);
      return rows;
    } catch (error) {
      logger.error('Failed to fetch alerts', { parcelId, message: error.message });
      throw error;
    }
  }

  async getAlertsByRecordId(recordId) {
    try {
      const query = `
        SELECT * FROM stress_alerts
        WHERE record_id = ?
        ORDER BY created_at DESC
      `;
      const [rows] = await pool.execute(query, [recordId]);
      return rows;
    } catch (error) {
      logger.error('Failed to fetch alerts by record', { recordId, message: error.message });
      throw error;
    }
  }

  async resolveAlert(alertId) {
    try {
      const query = `
        UPDATE stress_alerts 
        SET is_resolved = TRUE, resolved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      await pool.execute(query, [alertId]);
      logger.info(`Alert resolved`, { alertId });
    } catch (error) {
      logger.error('Failed to resolve alert', { alertId, message: error.message });
      throw error;
    }
  }

  async resolveAlertsByParcelId(parcelId) {
    try {
      const query = `
        UPDATE stress_alerts 
        SET is_resolved = TRUE, resolved_at = CURRENT_TIMESTAMP
        WHERE parcel_id = ? AND is_resolved = FALSE
      `;
      const [result] = await pool.execute(query, [parcelId]);
      logger.info(`Alerts resolved for parcel`, { parcelId, count: result.affectedRows });
    } catch (error) {
      logger.error('Failed to resolve parcel alerts', { parcelId, message: error.message });
      throw error;
    }
  }

  async getUnresolvedCount(parcelId) {
    try {
      const query = `
        SELECT COUNT(*) as count FROM stress_alerts
        WHERE parcel_id = ? AND is_resolved = FALSE
      `;
      const [rows] = await pool.execute(query, [parcelId]);
      return rows[0].count;
    } catch (error) {
      logger.error('Failed to count alerts', { parcelId, message: error.message });
      throw error;
    }
  }
}

module.exports = new AlertRepository();
