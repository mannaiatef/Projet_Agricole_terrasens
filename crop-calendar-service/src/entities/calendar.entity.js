/**
 * Calendar Entity
 * Represents a crop calendar for a specific parcelle
 */
class Calendar {
  constructor(
    id,
    parcelle_id,
    crop_id,
    sowing_date,
    created_at = null,
    updated_at = null
  ) {
    this.id = id;
    this.parcelle_id = parcelle_id;
    this.crop_id = crop_id;
    this.sowing_date = sowing_date;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   * Convert entity to JSON
   */
  toJSON() {
    return {
      id: this.id,
      parcelle_id: this.parcelle_id,
      crop_id: this.crop_id,
      sowing_date: this.sowing_date,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Calendar;
