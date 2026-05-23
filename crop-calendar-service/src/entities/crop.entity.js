/**
 * Crop Entity
 * Represents a crop with its properties and metadata
 */
class Crop {
  constructor(id, name, duration_days, created_at = null, updated_at = null) {
    this.id = id;
    this.name = name;
    this.duration_days = duration_days;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   * Convert entity to JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      duration_days: this.duration_days,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Crop;
