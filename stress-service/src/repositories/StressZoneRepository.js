const { pool } = require('../config/database');
const logger = require('../utils/logger');

class StressZoneRepository {
  async create(recordId, zones) {
    try {
      const query = `
        INSERT INTO stress_zones (record_id, geojson, stress_level, zone_area, pixel_count, mean_ndvi_in_zone)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const insertedZones = [];
      for (const zone of zones) {
        const [result] = await pool.execute(query, [
          recordId,
          JSON.stringify(zone.geojson),
          zone.stressLevel,
          zone.zoneArea || null,
          zone.pixelCount || null,
          zone.meanNdviInZone || null
        ]);
        insertedZones.push({ id: result.insertId, ...zone });
      }

      logger.info(`Stress zones created`, { recordId, count: zones.length });
      return insertedZones;
    } catch (error) {
      logger.error('Failed to create stress zones', { recordId, message: error.message });
      throw error;
    }
  }

  async getByRecordId(recordId) {
    try {
      const query = `
        SELECT id, record_id, JSON_UNQUOTE(geojson) AS geojson, 
               stress_level, zone_area, pixel_count, mean_ndvi_in_zone, created_at
        FROM stress_zones 
        WHERE record_id = ?
      `;
      const [rows] = await pool.execute(query, [recordId]);
      return rows.map(row => ({
        ...row,
        geojson: JSON.parse(row.geojson)
      }));
    } catch (error) {
      logger.error('Failed to fetch stress zones', { recordId, message: error.message });
      throw error;
    }
  }

  async getByStressLevel(recordId, stressLevel) {
    try {
      const query = `
        SELECT id, record_id, JSON_UNQUOTE(geojson) AS geojson, 
               stress_level, zone_area, pixel_count, mean_ndvi_in_zone, created_at
        FROM stress_zones 
        WHERE record_id = ? AND stress_level = ?
      `;
      const [rows] = await pool.execute(query, [recordId, stressLevel]);
      return rows.map(row => ({
        ...row,
        geojson: JSON.parse(row.geojson)
      }));
    } catch (error) {
      logger.error('Failed to fetch stress zones by level', { recordId, stressLevel, message: error.message });
      throw error;
    }
  }

  async deleteByRecordId(recordId) {
    try {
      const query = 'DELETE FROM stress_zones WHERE record_id = ?';
      const [result] = await pool.execute(query, [recordId]);
      logger.info(`Stress zones deleted`, { recordId, count: result.affectedRows });
    } catch (error) {
      logger.error('Failed to delete stress zones', { recordId, message: error.message });
      throw error;
    }
  }

  async getStressZonesSummary(recordId) {
    try {
      const query = `
        SELECT 
          stress_level,
          COUNT(*) AS zone_count,
          SUM(zone_area) AS total_area,
          SUM(pixel_count) AS total_pixels,
          AVG(mean_ndvi_in_zone) AS avg_ndvi
        FROM stress_zones
        WHERE record_id = ?
        GROUP BY stress_level
      `;
      const [rows] = await pool.execute(query, [recordId]);
      return rows;
    } catch (error) {
      logger.error('Failed to fetch stress zones summary', { recordId, message: error.message });
      throw error;
    }
  }
}

module.exports = new StressZoneRepository();
