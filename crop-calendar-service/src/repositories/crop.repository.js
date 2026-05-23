const { pool } = require('../config/db');
const Crop = require('../entities/crop.entity');

class CropRepository {
  /**
   * Find all crops
   */
  async findAll() {
    try {
      console.log('CropRepository.findAll() - Getting connection...');
      const connection = await pool.getConnection();
      console.log('CropRepository.findAll() - Executing query...');
      const [rows] = await connection.query('SELECT * FROM crops ORDER BY name');
      console.log('CropRepository.findAll() - Query complete, rows:', rows.length);
      connection.release();

      return rows.map(
        (row) =>
          new Crop(row.id, row.name, row.duration_days, row.created_at, row.updated_at)
      );
    } catch (error) {
      console.error('CropRepository.findAll() error:', error.message);
      throw error;
    }
  }

  /**
   * Find crop by id
   */
  async findById(id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT * FROM crops WHERE id = ?', [id]);
      connection.release();

      if (rows.length === 0) return null;

      const row = rows[0];
      return new Crop(row.id, row.name, row.duration_days, row.created_at, row.updated_at);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find crop by name
   */
  async findByName(name) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT * FROM crops WHERE name = ?', [name]);
      connection.release();

      if (rows.length === 0) return null;

      const row = rows[0];
      return new Crop(row.id, row.name, row.duration_days, row.created_at, row.updated_at);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new crop
   */
  async create(crop) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        'INSERT INTO crops (name, duration_days) VALUES (?, ?)',
        [crop.name, crop.duration_days]
      );
      connection.release();

      crop.id = result.insertId;
      return crop;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update crop
   */
  async update(crop) {
    try {
      const connection = await pool.getConnection();
      await connection.query('UPDATE crops SET name = ?, duration_days = ? WHERE id = ?', [
        crop.name,
        crop.duration_days,
        crop.id,
      ]);
      connection.release();

      return crop;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete crop
   */
  async delete(id) {
    try {
      const connection = await pool.getConnection();
      await connection.query('DELETE FROM crops WHERE id = ?', [id]);
      connection.release();

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CropRepository();
