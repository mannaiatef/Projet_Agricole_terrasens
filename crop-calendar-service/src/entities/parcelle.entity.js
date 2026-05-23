/**
 * Parcelle Entity
 * Represents a farm parcel/plot of land with geospatial data
 */
class Parcelle {
  constructor(
    id,
    user_id,
    name,
    latitude,
    longitude,
    polygon,
    surface = null,
    lang = null,
    crop_id = null,
    sowing_date = null,
    created_at = null,
    updated_at = null
  ) {
    this.id = id;
    this.user_id = user_id;
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
    this.polygon = typeof polygon === 'string' ? JSON.parse(polygon) : polygon;
    this.surface = surface;
    this.lang = lang;
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
      user_id: this.user_id,
      name: this.name,
      latitude: this.latitude,
      longitude: this.longitude,
      polygon: this.polygon,
      surface: this.surface,
      lang: this.lang,
      crop_id: this.crop_id,
      sowing_date: this.sowing_date,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  /**
   * Convert to stress-service compatible format (minimal required fields)
   */
  toStressServiceFormat() {
    return {
      id: this.id,
      name: this.name,
      latitude: this.latitude,
      longitude: this.longitude,
      polygon: this.polygon,
    };
  }
}

module.exports = Parcelle;
