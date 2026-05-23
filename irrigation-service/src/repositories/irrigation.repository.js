const { pool } = require('../config/db');
const Logger = require('../utils/logger');

class IrrigationRecordRepository {
  /**
   * Create new irrigation record
   */
  async create(record) {
    const {
      parcel_id,
      water_amount,
      duration,
      priority,
      recommended_time,
      status = 'PENDING',
      weather_data,
      stress_data,
      crop_data,
    } = record;

    const query = `
      INSERT INTO irrigation_records 
      (parcel_id, water_amount, duration, priority, recommended_time, status, 
       weather_data, stress_data, crop_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(query, [
        parcel_id,
        water_amount,
        duration,
        priority,
        recommended_time,
        status,
        weather_data ? JSON.stringify(weather_data) : null,
        stress_data ? JSON.stringify(stress_data) : null,
        crop_data ? JSON.stringify(crop_data) : null,
      ]);

      Logger.info(`IrrigationRecord created: parcel_id=${parcel_id}, id=${result.insertId}`);
      return { id: result.insertId, ...record };
    } finally {
      connection.release();
    }
  }

  /**
   * Get latest irrigation record for a parcel
   */
  async getLatest(parcel_id) {
    const query = `
      SELECT 
        id, parcel_id, water_amount, duration, priority, 
        recommended_time, status, weather_data, stress_data, crop_data, created_at
      FROM irrigation_records
      WHERE parcel_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(query, [parcel_id]);
      if (rows.length === 0) return null;

      const record = rows[0];
      return {
        ...record,
        weather_data: record.weather_data ? JSON.parse(record.weather_data) : null,
        stress_data: record.stress_data ? JSON.parse(record.stress_data) : null,
        crop_data: record.crop_data ? JSON.parse(record.crop_data) : null,
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Get irrigation history for a parcel
   */
  async getHistory(parcel_id, limit = 30) {
    const query = `
      SELECT 
        id, parcel_id, water_amount, duration, priority, 
        recommended_time, status, created_at
      FROM irrigation_records
      WHERE parcel_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(query, [parcel_id, limit]);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Update irrigation record status
   */
  async updateStatus(id, status) {
    const query = `UPDATE irrigation_records SET status = ? WHERE id = ?`;

    const connection = await pool.getConnection();
    try {
      await connection.execute(query, [status, id]);
      Logger.info(`IrrigationRecord updated: id=${id}, status=${status}`);
    } finally {
      connection.release();
    }
  }
}

class IrrigationScheduleRepository {
  /**
   * Create new irrigation schedule
   */
  async create(schedule) {
    const { parcel_id, scheduled_time, water_amount, duration, reason } = schedule;

    const query = `
      INSERT INTO irrigation_schedule 
      (parcel_id, scheduled_time, water_amount, duration, reason, status)
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `;

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(query, [
        parcel_id,
        scheduled_time,
        water_amount,
        duration,
        reason,
      ]);

      Logger.info(`IrrigationSchedule created: parcel_id=${parcel_id}, id=${result.insertId}`);
      return { id: result.insertId, ...schedule };
    } finally {
      connection.release();
    }
  }

  /**
   * Get pending schedules
   */
  async getPending(limit = 100) {
    const query = `
      SELECT id, parcel_id, scheduled_time, water_amount, duration, reason, status
      FROM irrigation_schedule
      WHERE status = 'PENDING' AND scheduled_time <= NOW()
      ORDER BY scheduled_time ASC
      LIMIT ?
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(query, [limit]);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get next scheduled irrigation
   */
  async getNext(parcel_id) {
    const query = `
      SELECT id, parcel_id, scheduled_time, water_amount, duration, reason, status
      FROM irrigation_schedule
      WHERE parcel_id = ? AND status IN ('PENDING', 'EXECUTED')
      ORDER BY scheduled_time DESC
      LIMIT 1
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(query, [parcel_id]);
      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Update schedule status
   */
  async updateStatus(id, status, executedAt = null) {
    const query = `
      UPDATE irrigation_schedule 
      SET status = ?, executed_at = ?
      WHERE id = ?
    `;

    const connection = await pool.getConnection();
    try {
      await connection.execute(query, [status, executedAt || new Date(), id]);
      Logger.info(`IrrigationSchedule updated: id=${id}, status=${status}`);
    } finally {
      connection.release();
    }
  }
}

class IrrigationAlertRepository {
  /**
   * Create alert
   */
  async create(alert) {
    const { parcel_id, alert_type, message, severity = 'WARNING' } = alert;

    const query = `
      INSERT INTO irrigation_alerts (parcel_id, alert_type, message, severity, status)
      VALUES (?, ?, ?, ?, 'OPEN')
    `;

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(query, [
        parcel_id,
        alert_type,
        message,
        severity,
      ]);

      Logger.warn(`Alert created: parcel_id=${parcel_id}, type=${alert_type}`);
      return { id: result.insertId, ...alert };
    } finally {
      connection.release();
    }
  }

  /**
   * Get open alerts
   */
  async getOpen(parcel_id) {
    const query = `
      SELECT id, parcel_id, alert_type, message, severity, status, created_at
      FROM irrigation_alerts
      WHERE parcel_id = ? AND status = 'OPEN'
      ORDER BY created_at DESC
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(query, [parcel_id]);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Resolve alert
   */
  async resolve(id) {
    const query = `
      UPDATE irrigation_alerts 
      SET status = 'RESOLVED', resolved_at = NOW()
      WHERE id = ?
    `;

    const connection = await pool.getConnection();
    try {
      await connection.execute(query, [id]);
    } finally {
      connection.release();
    }
  }
}

/**
 * Irrigation Recommendation Repository
 * Handles storage and retrieval of irrigation recommendations/reports
 */
class IrrigationRecommendationRepository {
  /**
   * Save irrigation recommendation report
   */
  async saveRecommendation(recommendation) {
    const {
      parcel_id,
      parcel_name,
      crop_name,
      area_hectares,
      water_amount_mm,
      water_volume_m3,
      duration_minutes,
      priority,
      recommended_time,
      decision_reason,
      calculations,
      conditions,
      location,
    } = recommendation;

    const query = `
      INSERT INTO irrigation_recommendations (
        parcel_id, parcel_name, crop_name, area_hectares,
        water_amount_mm, water_volume_m3, duration_minutes,
        priority, recommended_time, decision_reason,
        et0, kc, etc, base_water_amount, stress_adjustment, humidity_adjustment,
        stress_percentage, stress_score, ndvi, temperature, humidity,
        rain_forecast_24h, weather_description,
        parcel_latitude, parcel_longitude
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `;

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(query, [
        parcel_id,
        parcel_name,
        crop_name,
        area_hectares,
        water_amount_mm,
        water_volume_m3,
        duration_minutes,
        priority,
        recommended_time,
        decision_reason,
        calculations?.et0,
        calculations?.kc,
        calculations?.etc,
        calculations?.base_water_amount,
        calculations?.stress_adjustment,
        calculations?.humidity_adjustment,
        conditions?.stress_percentage,
        conditions?.stress_score,
        conditions?.ndvi,
        conditions?.temperature,
        conditions?.humidity,
        conditions?.rain_forecast_24h,
        conditions?.weather_description,
        location?.latitude,
        location?.longitude,
      ]);

      Logger.info(`Recommendation saved: parcel_id=${parcel_id}, recommendation_id=${result.insertId}`);
      return { id: result.insertId, ...recommendation };
    } catch (error) {
      Logger.error('Failed to save recommendation', { parcel_id, error: error.message });
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get latest recommendation for a parcel
   */
  async getLatest(parcel_id) {
    const query = `
      SELECT *
      FROM irrigation_recommendations
      WHERE parcel_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(query, [parcel_id]);
      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get recommendation history for a parcel
   */
  async getHistory(parcel_id, limit = 50) {
    const query = `
      SELECT 
        id, parcel_name, crop_name, water_amount_mm, water_volume_m3,
        duration_minutes, priority, stress_percentage, ndvi, 
        temperature, humidity, created_at
      FROM irrigation_recommendations
      WHERE parcel_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(query, [parcel_id, limit]);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get recommendations by date range
   */
  async getByDateRange(parcel_id, startDate, endDate) {
    const query = `
      SELECT *
      FROM irrigation_recommendations
      WHERE parcel_id = ? AND created_at BETWEEN ? AND ?
      ORDER BY created_at DESC
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(query, [parcel_id, startDate, endDate]);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all recommendations by priority
   */
  async getByPriority(parcel_id, priority) {
    const query = `
      SELECT *
      FROM irrigation_recommendations
      WHERE parcel_id = ? AND priority = ?
      ORDER BY created_at DESC
      LIMIT 30
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(query, [parcel_id, priority]);
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = {
  IrrigationRecordRepository,
  IrrigationScheduleRepository,
  IrrigationAlertRepository,
  IrrigationRecommendationRepository,
};
