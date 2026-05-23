/**
 * Parcelle Data Transfer Objects (DTOs)
 * Used to format data for API responses
 * 
 * Supports both legacy format (separate lat/lon + polygon) and modern GeoJSON format
 */

/**
 * Full Parcelle DTO - Contains all parcelle information
 */
class ParcelleDTO {
  constructor(parcelle) {
    this.id = parcelle.id;
    this.user_id = parcelle.user_id;
    this.name = parcelle.name;
    this.latitude = parcelle.latitude;
    this.longitude = parcelle.longitude;
    this.polygon = this._parseGeometry(parcelle.polygon);
    this.geometry = this._buildGeometry(parcelle); // GeoJSON Feature format
    this.surface = parcelle.surface;
    this.lang = parcelle.lang;
    this.crop_id = parcelle.crop_id;
    this.sowing_date = parcelle.sowing_date;
    this.created_at = parcelle.created_at;
    this.updated_at = parcelle.updated_at;
  }

  /**
   * Parse geometry field (handles string and object formats)
   */
  _parseGeometry(geometry) {
    if (!geometry) return null;
    if (typeof geometry === 'string') {
      try {
        return JSON.parse(geometry);
      } catch (e) {
        console.warn('Failed to parse geometry:', geometry);
        return null;
      }
    }
    return geometry;
  }

  /**
   * Build GeoJSON Feature from parcelle data
   */
  _buildGeometry(parcelle) {
    const polygon = this._parseGeometry(parcelle.polygon);
    if (!polygon) return null;

    return {
      type: 'Feature',
      geometry: polygon,
      properties: {
        id: parcelle.id,
        name: parcelle.name,
        surface: parcelle.surface,
        latitude: parcelle.latitude,
        longitude: parcelle.longitude,
        crop_id: parcelle.crop_id,
        lang: parcelle.lang
      }
    };
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      name: this.name,
      latitude: this.latitude,
      longitude: this.longitude,
      polygon: this.polygon,
      geometry: this.geometry, // Full GeoJSON Feature
      surface: this.surface,
      lang: this.lang,
      crop_id: this.crop_id,
      sowing_date: this.sowing_date,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

/**
 * Minimal Parcelle DTO - Only geo-data for stress-service
 * Used for service-to-service communication
 */
class ParcelleGeoDTO {
  constructor(parcelle) {
    this.id = parcelle.id;
    this.name = parcelle.name;
    this.latitude = parcelle.latitude;
    this.longitude = parcelle.longitude;
    this.polygon = this._parseGeometry(parcelle.polygon);
    this.surface = parcelle.surface;
  }

  _parseGeometry(geometry) {
    if (!geometry) return null;
    if (typeof geometry === 'string') {
      try {
        return JSON.parse(geometry);
      } catch (e) {
        return null;
      }
    }
    return geometry;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      latitude: this.latitude,
      longitude: this.longitude,
      polygon: this.polygon,
      surface: this.surface,
    };
  }
}

/**
 * Create Parcelle DTO - For POST/PUT request validation
 * Supports map-drawn geometry with automatic area calculation
 */
class CreateParcelleDTO {
  constructor(data) {
    this.user_id = data.user_id;
    this.name = data.name;
    
    // Support both formats:
    // 1. Traditional: latitude + longitude + polygon (sent from form)
    // 2. Map drawing: geometry (GeoJSON) with auto-calculated center
    if (data.geometry) {
      // Map drawing format
      this.geometry = data.geometry;
      this.polygon = data.geometry;
      // Extract center coordinates from geometry properties or calculate
      if (data.geometry.properties?.latitude && data.geometry.properties?.longitude) {
        this.latitude = data.geometry.properties.latitude;
        this.longitude = data.geometry.properties.longitude;
      } else {
        this.latitude = data.latitude;
        this.longitude = data.longitude;
      }
    } else {
      // Traditional format
      this.latitude = data.latitude;
      this.longitude = data.longitude;
      this.polygon = data.polygon;
    }
    
    // Auto-calculated or provided surface
    this.surface = data.surface || null;
    this.crop_id = data.crop_id || null;
    this.sowing_date = data.sowing_date || null;
    this.soil_type = data.soil_type || null;
    this.irrigation_type = data.irrigation_type || null;
  }

  /**
   * Validate required fields with enhanced geometry support
   * @returns {object} { valid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.user_id) errors.push('user_id is required');
    if (!this.name || typeof this.name !== 'string') errors.push('name is required and must be a string');
    if (this.latitude === null || this.latitude === undefined || typeof this.latitude !== 'number') {
      errors.push('latitude is required and must be a number');
    }
    if (this.longitude === null || this.longitude === undefined || typeof this.longitude !== 'number') {
      errors.push('longitude is required and must be a number');
    }
    
    // Validate polygon/geometry
    if (!this.polygon && !this.geometry) {
      errors.push('polygon or geometry is required');
    }
    
    // If polygon is provided, validate as GeoJSON
    if (this.polygon && typeof this.polygon === 'object') {
      if (!this._isValidGeoJSON()) {
        errors.push('polygon must be valid GeoJSON');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Check if polygon is valid GeoJSON Polygon
   */
  _isValidGeoJSON() {
    if (!this.polygon) return false;
    
    // Handle string geometry
    let geo = this.polygon;
    if (typeof geo === 'string') {
      try {
        geo = JSON.parse(geo);
      } catch (e) {
        return false;
      }
    }

    // Must be a Feature with Polygon geometry or geometric object
    if (geo.type === 'Feature') {
      geo = geo.geometry;
    }

    return geo && (geo.type === 'Polygon' || geo.type === 'MultiPolygon');
  }

  toJSON() {
    return {
      user_id: this.user_id,
      name: this.name,
      latitude: this.latitude,
      longitude: this.longitude,
      polygon: this.polygon,
      surface: this.surface,
      crop_id: this.crop_id,
      sowing_date: this.sowing_date,
      soil_type: this.soil_type,
      irrigation_type: this.irrigation_type,
    };
  }
}

/**
 * Update Parcelle DTO - For PUT request
 */
class UpdateParcelleDTO {
  constructor(data) {
    this.name = data.name || undefined;
    this.latitude = data.latitude !== undefined ? data.latitude : undefined;
    this.longitude = data.longitude !== undefined ? data.longitude : undefined;
    this.polygon = data.polygon || undefined;
    this.surface = data.surface !== undefined ? data.surface : undefined;
    this.crop_id = data.crop_id !== undefined ? data.crop_id : undefined;
    this.sowing_date = data.sowing_date || undefined;
    this.soil_type = data.soil_type !== undefined ? data.soil_type : undefined;
    this.irrigation_type = data.irrigation_type !== undefined ? data.irrigation_type : undefined;
  }

  /**
   * Get only the fields that were provided (not undefined)
   */
  getProvidedFields() {
    const fields = {};
    Object.keys(this).forEach(key => {
      if (this[key] !== undefined) {
        fields[key] = this[key];
      }
    });
    return fields;
  }

  toJSON() {
    return this.getProvidedFields();
  }
}

module.exports = {
  ParcelleDTO,
  ParcelleGeoDTO,
  CreateParcelleDTO,
  UpdateParcelleDTO,
};
