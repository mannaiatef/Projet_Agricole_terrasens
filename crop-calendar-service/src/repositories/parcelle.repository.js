const { pool } = require('../config/db');
const Parcelle = require('../entities/parcelle.entity');
const logger = require('../utils/logger');

class ParcelleRepository {
  /**
   * Find all parcelles for a user
   */
  async findByUserId(user_id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM parcelles WHERE user_id = ? ORDER BY created_at DESC',
        [user_id]
      );
      connection.release();

      return rows.map((row) => this.mapRowToParcelle(row));
    } catch (error) {
      logger.error('ParcelleRepository.findByUserId() error:', error.message);
      throw error;
    }
  }

  /**
   * Find all parcelles (without user filter - for internal service calls)
   */
  async findAll() {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT * FROM parcelles ORDER BY created_at DESC');
      connection.release();

      return rows.map((row) => this.mapRowToParcelle(row));
    } catch (error) {
      logger.error('ParcelleRepository.findAll() error:', error.message);
      throw error;
    }
  }

  /**
   * Find parcelle by id
   */
  async findById(id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT * FROM parcelles WHERE id = ?', [id]);
      connection.release();

      if (rows.length === 0) return null;

      return this.mapRowToParcelle(rows[0]);
    } catch (error) {
      logger.error('ParcelleRepository.findById() error:', error.message);
      throw error;
    }
  }

  /**
   * Create a new parcelle
   */
  async create(parcelle) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        `INSERT INTO parcelles (
          user_id, name, latitude, longitude, polygon, 
          surface, lang, crop_id, sowing_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parcelle.user_id,
          parcelle.name,
          parcelle.latitude,
          parcelle.longitude,
          JSON.stringify(parcelle.polygon),
          parcelle.surface,
          parcelle.lang,
          parcelle.crop_id,
          parcelle.sowing_date,
        ]
      );
      connection.release();

      parcelle.id = result.insertId;
      return parcelle;
    } catch (error) {
      logger.error('ParcelleRepository.create() error:', error.message);
      throw error;
    }
  }

  /**
   * Update parcelle with only provided fields
   */
  async update(parcelle) {
    try {
      const connection = await pool.getConnection();
      await connection.query(
        `UPDATE parcelles SET 
          name = ?, latitude = ?, longitude = ?, polygon = ?, 
          surface = ?, lang = ?, crop_id = ?, sowing_date = ?
        WHERE id = ?`,
        [
          parcelle.name,
          parcelle.latitude,
          parcelle.longitude,
          JSON.stringify(parcelle.polygon),
          parcelle.surface,
          parcelle.lang,
          parcelle.crop_id,
          parcelle.sowing_date,
          parcelle.id,
        ]
      );
      connection.release();

      return parcelle;
    } catch (error) {
      logger.error('ParcelleRepository.update() error:', error.message);
      throw error;
    }
  }

  /**
   * Delete parcelle
   */
  async delete(id) {
    try {
      const connection = await pool.getConnection();
      await connection.query('DELETE FROM parcelles WHERE id = ?', [id]);
      connection.release();

      return true;
    } catch (error) {
      logger.error('ParcelleRepository.delete() error:', error.message);
      throw error;
    }
  }

  /**
   * Map database row to Parcelle entity
   */
  mapRowToParcelle(row) {
    return new Parcelle(
      row.id,
      row.user_id,
      row.name,
      row.latitude,
      row.longitude,
      row.polygon,
      row.surface,
      row.lang,
      row.crop_id,
      row.sowing_date,
      row.created_at,
      row.updated_at
    );
  }
}

module.exports = new ParcelleRepository();
