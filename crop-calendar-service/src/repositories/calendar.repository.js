const { pool } = require('../config/db');
const Calendar = require('../entities/calendar.entity');

class CalendarRepository {
  /**
   * Find all calendars for a parcelle
   */
  async findByParcelleId(parcelle_id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM calendars WHERE parcelle_id = ? ORDER BY created_at DESC',
        [parcelle_id]
      );
      connection.release();

      return rows.map(
        (row) =>
          new Calendar(
            row.id,
            row.parcelle_id,
            row.crop_id,
            row.sowing_date,
            row.created_at,
            row.updated_at
          )
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find calendar by id
   */
  async findById(id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT * FROM calendars WHERE id = ?', [id]);
      connection.release();

      if (rows.length === 0) return null;

      const row = rows[0];
      return new Calendar(
        row.id,
        row.parcelle_id,
        row.crop_id,
        row.sowing_date,
        row.created_at,
        row.updated_at
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new calendar
   */
  async create(calendar) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        'INSERT INTO calendars (parcelle_id, crop_id, sowing_date) VALUES (?, ?, ?)',
        [calendar.parcelle_id, calendar.crop_id, calendar.sowing_date]
      );
      connection.release();

      calendar.id = result.insertId;
      return calendar;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update calendar
   */
  async update(calendar) {
    try {
      const connection = await pool.getConnection();
      await connection.query(
        'UPDATE calendars SET parcelle_id = ?, crop_id = ?, sowing_date = ? WHERE id = ?',
        [calendar.parcelle_id, calendar.crop_id, calendar.sowing_date, calendar.id]
      );
      connection.release();

      return calendar;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete calendar
   */
  async delete(id) {
    try {
      const connection = await pool.getConnection();
      await connection.query('DELETE FROM calendars WHERE id = ?', [id]);
      connection.release();

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CalendarRepository();
