const { pool } = require('../config/database');
const logger = require('../utils/logger');

class StressRecordRepository {
  async create(parcelId, data) {
    try {
      const query = `
        INSERT INTO stress_records (parcel_id, mean_ndvi, stress_percentage, 
          pixel_count, stressed_pixel_count, status, imagery_date, cloud_coverage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.execute(query, [
        parcelId,
        data.meanNdvi || null,
        data.stressPercentage || null,
        data.pixelCount || null,
        data.stressedPixelCount || null,
        data.status || 'pending',
        data.imageryDate || null,
        data.cloudCoverage || null
      ]);
      
      logger.info(`Stress record created`, { recordId: result.insertId, parcelId });
      return { id: result.insertId, ...data };
    } catch (error) {
      logger.error('Failed to create stress record', { parcelId, message: error.message });
      throw error;
    }
  }

  async getById(recordId) {
    try {
      const query = 'SELECT * FROM stress_records WHERE id = ?';
      const [rows] = await pool.execute(query, [recordId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Failed to fetch stress record', { recordId, message: error.message });
      throw error;
    }
  }

  async getLatestByParcelId(parcelId) {
    try {
      const query = `
        SELECT * FROM stress_records 
        WHERE parcel_id = ? AND status = 'completed'
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      const [rows] = await pool.execute(query, [parcelId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Failed to fetch latest stress record', { parcelId, message: error.message });
      throw error;
    }
  }

  async getAllByParcelId(parcelId, limit = 50) {
    try {
      const query = `
        SELECT * FROM stress_records 
        WHERE parcel_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      const [rows] = await pool.execute(query, [parcelId, limit]);
      return rows;
    } catch (error) {
      logger.error('Failed to fetch stress records', { parcelId, message: error.message });
      throw error;
    }
  }

  async updateStatus(recordId, status, errorMessage = null) {
    try {
      const query = `
        UPDATE stress_records 
        SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      await pool.execute(query, [status, errorMessage, recordId]);
      logger.info(`Stress record status updated`, { recordId, status });
    } catch (error) {
      logger.error('Failed to update stress record status', { recordId, message: error.message });
      throw error;
    }
  }

  async updateAnalysisResults(recordId, results) {
    try {
      const query = `
        UPDATE stress_records 
        SET mean_ndvi = ?, stress_percentage = ?, 
            pixel_count = ?, stressed_pixel_count = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      await pool.execute(query, [
        results.meanNdvi,
        results.stressPercentage,
        results.pixelCount,
        results.stressedPixelCount,
        recordId
      ]);
      logger.info(`Stress analysis results updated`, { recordId });
    } catch (error) {
      logger.error('Failed to update analysis results', { recordId, message: error.message });
      throw error;
    }
  }

  async delete(recordId) {
    try {
      const query = 'DELETE FROM stress_records WHERE id = ?';
      await pool.execute(query, [recordId]);
      logger.info(`Stress record deleted`, { recordId });
    } catch (error) {
      logger.error('Failed to delete stress record', { recordId, message: error.message });
      throw error;
    }
  }
}

module.exports = new StressRecordRepository();
