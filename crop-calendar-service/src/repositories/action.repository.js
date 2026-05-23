const { pool } = require('../config/db');
const Action = require('../entities/action.entity');

class ActionRepository {
  /**
   * Find all actions for a stage
   */
  async findByStageId(stage_id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM actions WHERE stage_id = ? ORDER BY priority DESC, id',
        [stage_id]
      );
      connection.release();

      return rows.map(
        (row) =>
          new Action(
            row.id,
            row.stage_id,
            row.type,
            row.title,
            row.description,
            row.how_to,
            row.frequency,
            row.priority,
            row.alert_message,
            row.created_at,
            row.updated_at
          )
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find action by id
   */
  async findById(id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT * FROM actions WHERE id = ?', [id]);
      connection.release();

      if (rows.length === 0) return null;

      const row = rows[0];
      return new Action(
        row.id,
        row.stage_id,
        row.type,
        row.title,
        row.description,
        row.how_to,
        row.frequency,
        row.priority,
        row.alert_message,
        row.created_at,
        row.updated_at
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new action
   */
  async create(action) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        'INSERT INTO actions (stage_id, type, title, description, how_to, frequency, priority, alert_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          action.stage_id,
          action.type,
          action.title,
          action.description,
          action.how_to,
          action.frequency,
          action.priority,
          action.alert_message,
        ]
      );
      connection.release();

      action.id = result.insertId;
      return action;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update action
   */
  async update(action) {
    try {
      const connection = await pool.getConnection();
      await connection.query(
        'UPDATE actions SET stage_id = ?, type = ?, title = ?, description = ?, how_to = ?, frequency = ?, priority = ?, alert_message = ? WHERE id = ?',
        [
          action.stage_id,
          action.type,
          action.title,
          action.description,
          action.how_to,
          action.frequency,
          action.priority,
          action.alert_message,
          action.id,
        ]
      );
      connection.release();

      return action;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete action
   */
  async delete(id) {
    try {
      const connection = await pool.getConnection();
      await connection.query('DELETE FROM actions WHERE id = ?', [id]);
      connection.release();

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ActionRepository();
