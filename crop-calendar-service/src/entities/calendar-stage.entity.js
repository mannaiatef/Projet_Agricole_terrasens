/**
 * Calendar Stage Entity
 * Represents a stage instance within a specific calendar
 */
class CalendarStage {
  constructor(
    id,
    calendar_id,
    stage_id,
    start_date,
    end_date,
    created_at = null,
    updated_at = null
  ) {
    this.id = id;
    this.calendar_id = calendar_id;
    this.stage_id = stage_id;
    this.start_date = start_date;
    this.end_date = end_date;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   * Convert entity to JSON
   */
  toJSON() {
    return {
      id: this.id,
      calendar_id: this.calendar_id,
      stage_id: this.stage_id,
      start_date: this.start_date,
      end_date: this.end_date,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = CalendarStage;
