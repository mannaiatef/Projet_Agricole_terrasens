const { pool } = require('../config/db');
const CalendarStage = require('../entities/calendar-stage.entity');

class CalendarStageRepository {
  /**
   * Find all stages for a calendar
   */
  async findByCalendarId(calendar_id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        'SELECT cs.*, s.name, s.stage_order, s.duration_days, s.kc_value FROM calendar_stages cs JOIN stages s ON cs.stage_id = s.id WHERE cs.calendar_id = ? ORDER BY s.stage_order',
        [calendar_id]
      );
      connection.release();

      return rows.map((row) => {
        const stage = new CalendarStage(
          row.id,
          row.calendar_id,
          row.stage_id,
          row.start_date,
          row.end_date,
          row.created_at,
          row.updated_at
        );
        // Attach stage details
        stage.stage_name = row.name;
        stage.stage_order = row.stage_order;
        stage.kc_value = row.kc_value;
        return stage;
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find calendar stage by id
   */
  async findById(id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        'SELECT cs.*, s.name, s.kc_value FROM calendar_stages cs JOIN stages s ON cs.stage_id = s.id WHERE cs.id = ?',
        [id]
      );
      connection.release();

      if (rows.length === 0) return null;

      const row = rows[0];
      const stage = new CalendarStage(
        row.id,
        row.calendar_id,
        row.stage_id,
        row.start_date,
        row.end_date,
        row.created_at,
        row.updated_at
      );
      stage.stage_name = row.name;
      stage.kc_value = row.kc_value;
      return stage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new calendar stage
   */
  async create(calendarStage) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        'INSERT INTO calendar_stages (calendar_id, stage_id, start_date, end_date) VALUES (?, ?, ?, ?)',
        [calendarStage.calendar_id, calendarStage.stage_id, calendarStage.start_date, calendarStage.end_date]
      );
      connection.release();

      calendarStage.id = result.insertId;
      return calendarStage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update calendar stage
   */
  async update(calendarStage) {
    try {
      const connection = await pool.getConnection();
      await connection.query(
        'UPDATE calendar_stages SET calendar_id = ?, stage_id = ?, start_date = ?, end_date = ? WHERE id = ?',
        [
          calendarStage.calendar_id,
          calendarStage.stage_id,
          calendarStage.start_date,
          calendarStage.end_date,
          calendarStage.id,
        ]
      );
      connection.release();

      return calendarStage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete calendar stage
   */
  async delete(id) {
    try {
      const connection = await pool.getConnection();
      await connection.query('DELETE FROM calendar_stages WHERE id = ?', [id]);
      connection.release();

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete all calendar stages for a calendar
   */
  async deleteByCalendarId(calendar_id) {
    try {
      const connection = await pool.getConnection();
      await connection.query('DELETE FROM calendar_stages WHERE calendar_id = ?', [calendar_id]);
      connection.release();

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CalendarStageRepository();
