/**
 * Action Entity
 * Represents an action to be taken during a crop stage
 */
class Action {
  constructor(
    id,
    stage_id,
    type,
    title,
    description,
    how_to,
    frequency,
    priority,
    alert_message,
    created_at = null,
    updated_at = null
  ) {
    this.id = id;
    this.stage_id = stage_id;
    this.type = type; // irrigation, fertilization, treatment, etc
    this.title = title;
    this.description = description;
    this.how_to = how_to;
    this.frequency = frequency; // daily, weekly, once, etc
    this.priority = priority; // high, medium, low
    this.alert_message = alert_message;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   * Convert entity to JSON
   */
  toJSON() {
    return {
      id: this.id,
      stage_id: this.stage_id,
      type: this.type,
      title: this.title,
      description: this.description,
      how_to: this.how_to,
      frequency: this.frequency,
      priority: this.priority,
      alert_message: this.alert_message,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Action;
