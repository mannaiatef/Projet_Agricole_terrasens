const { pool } = require('../config/db');
const Stage = require('../entities/stage.entity');

class StageRepository {
  /**
   * Find all stages for a crop
   */
  async findByCropId(crop_id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM stages WHERE crop_id = ? ORDER BY stage_order',
        [crop_id]
      );
      connection.release();

      return rows.map(
        (row) =>
          new Stage(
            row.id,
            row.crop_id,
            row.name,
            row.stage_order,
            row.duration_days,
            row.kc_value,
            row.created_at,
            row.updated_at
          )
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find stage by id
   */
  async findById(id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT * FROM stages WHERE id = ?', [id]);
      connection.release();

      if (rows.length === 0) return null;

      const row = rows[0];
      return new Stage(
        row.id,
        row.crop_id,
        row.name,
        row.stage_order,
        row.duration_days,
        row.kc_value,
        row.created_at,
        row.updated_at
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new stage
   */
  async create(stage) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        'INSERT INTO stages (crop_id, name, stage_order, duration_days, kc_value) VALUES (?, ?, ?, ?, ?)',
        [stage.crop_id, stage.name, stage.stage_order, stage.duration_days, stage.kc_value]
      );
      connection.release();

      stage.id = result.insertId;
      return stage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update stage
   */
  async update(stage) {
    try {
      const connection = await pool.getConnection();
      await connection.query(
        'UPDATE stages SET crop_id = ?, name = ?, stage_order = ?, duration_days = ?, kc_value = ? WHERE id = ?',
        [stage.crop_id, stage.name, stage.stage_order, stage.duration_days, stage.kc_value, stage.id]
      );
      connection.release();

      return stage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete stage
   */
  async delete(id) {
    try {
      const connection = await pool.getConnection();
      await connection.query('DELETE FROM stages WHERE id = ?', [id]);
      connection.release();

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new StageRepository();
