/**
 * Stage Entity
 * Represents a crop growth stage
 */
class Stage {
  constructor(
    id,
    crop_id,
    name,
    stage_order,
    duration_days,
    kc_value,
    created_at = null,
    updated_at = null
  ) {
    this.id = id;
    this.crop_id = crop_id;
    this.name = name;
    this.stage_order = stage_order;
    this.duration_days = duration_days;
    this.kc_value = kc_value;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   * Convert entity to JSON
   */
  toJSON() {
    return {
      id: this.id,
      crop_id: this.crop_id,
      name: this.name,
      stage_order: this.stage_order,
      duration_days: this.duration_days,
      kc_value: this.kc_value,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Stage;
