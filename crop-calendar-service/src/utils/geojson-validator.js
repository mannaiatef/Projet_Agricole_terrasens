/**
 * GeoJSON Validator Utility
 * Validates GeoJSON polygons and coordinate data
 * Supports both traditional GeoJSON Polygons and map-drawn geometries
 */

class GeoJSONValidator {
  /**
   * Parse geometry from various formats
   * @param {*} geometry - Raw geometry data (string, object, GeoJSON Feature, etc.)
   * @returns {object} Parsed geometry object or null
   */
  static parseGeometry(geometry) {
    if (!geometry) return null;

    // Handle string (JSON stringified)
    if (typeof geometry === 'string') {
      try {
        geometry = JSON.parse(geometry);
      } catch (e) {
        return null;
      }
    }

    // If it's a Feature, extract the geometry
    if (geometry.type === 'Feature' && geometry.geometry) {
      return geometry.geometry;
    }

    // Return the geometry as-is if it's already a geometry object
    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      return geometry;
    }

    return null;
  }

  /**
   * Validate a complete GeoJSON Polygon or Feature with Polygon geometry
   * @param {object} polygon - GeoJSON Polygon object or Feature
   * @returns {object} { valid: boolean, errors: string[] }
   */
  static validatePolygon(polygon) {
    const errors = [];

    if (!polygon) {
      errors.push('Polygon is required');
      return { valid: false, errors };
    }

    if (typeof polygon !== 'object') {
      errors.push('Polygon must be an object');
      return { valid: false, errors };
    }

    // If it's a Feature, extract geometry
    let geometry = polygon;
    if (polygon.type === 'Feature') {
      if (!polygon.geometry) {
        errors.push('Feature must have a geometry property');
        return { valid: false, errors };
      }
      geometry = polygon.geometry;
    }

    if (geometry.type !== 'Polygon') {
      errors.push('Geometry type must be "Polygon"');
    }

    if (!Array.isArray(geometry.coordinates)) {
      errors.push('Polygon.coordinates must be an array');
      return { valid: false, errors };
    }

    if (geometry.coordinates.length === 0) {
      errors.push('Polygon must have at least one ring');
      return { valid: false, errors };
    }

    // Validate each ring
    geometry.coordinates.forEach((ring, ringIndex) => {
      if (!Array.isArray(ring)) {
        errors.push(`Ring ${ringIndex} must be an array`);
        return;
      }

      if (ring.length < 4) {
        errors.push(`Ring ${ringIndex} must have at least 4 coordinates (closed ring)`);
        return;
      }

      // Check if ring is closed (first and last coordinates are the same)
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (JSON.stringify(first) !== JSON.stringify(last)) {
        errors.push(`Ring ${ringIndex} must be closed (first and last coordinates must be identical)`);
      }

      // Validate each coordinate in the ring
      ring.forEach((coord, coordIndex) => {
        if (!Array.isArray(coord) || coord.length < 2) {
          errors.push(`Ring ${ringIndex}, Coordinate ${coordIndex}: must be [longitude, latitude]`);
        } else {
          const [lon, lat] = coord;
          if (typeof lon !== 'number' || typeof lat !== 'number') {
            errors.push(`Ring ${ringIndex}, Coordinate ${coordIndex}: longitude and latitude must be numbers`);
          }
          if (lon < -180 || lon > 180) {
            errors.push(`Ring ${ringIndex}, Coordinate ${coordIndex}: longitude must be between -180 and 180`);
          }
          if (lat < -90 || lat > 90) {
            errors.push(`Ring ${ringIndex}, Coordinate ${coordIndex}: latitude must be between -90 and 90`);
          }
        }
      });
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Calculate polygon area in square meters using Shoelace formula with Haversine
   * @param {array} coordinates - Array of [lon, lat] coordinates
   * @returns {number} Area in square meters
   */
  static calculatePolygonArea(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length < 4) {
      return 0;
    }

    const R = 6371000; // Earth radius in meters
    let area = 0;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lon1, lat1] = coordinates[i];
      const [lon2, lat2] = coordinates[i + 1];

      const lat1Rad = this._toRadians(lat1);
      const lat2Rad = this._toRadians(lat2);
      const lonDiff = this._toRadians(lon2 - lon1);

      area += lonDiff * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
    }

    area = Math.abs(area * R * R / 2);
    return area;
  }

  /**
   * Calculate polygon centroid
   * @param {array} coordinates - Array of [lon, lat] coordinates
   * @returns {object} { latitude, longitude }
   */
  static calculatePolygonCenter(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return { latitude: 0, longitude: 0 };
    }

    let lat = 0;
    let lon = 0;

    for (const [l, la] of coordinates) {
      lon += l;
      lat += la;
    }

    const count = coordinates.length;
    return {
      latitude: lat / count,
      longitude: lon / count
    };
  }

  /**
   * Validate latitude value
   * @param {number} latitude
   * @returns {object} { valid: boolean, error: string|null }
   */
  static validateLatitude(latitude) {
    if (latitude === null || latitude === undefined) {
      return { valid: false, error: 'Latitude is required' };
    }

    if (typeof latitude !== 'number') {
      return { valid: false, error: 'Latitude must be a number' };
    }

    if (latitude < -90 || latitude > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90' };
    }

    return { valid: true, error: null };
  }

  /**
   * Validate longitude value
   * @param {number} longitude
   * @returns {object} { valid: boolean, error: string|null }
   */
  static validateLongitude(longitude) {
    if (longitude === null || longitude === undefined) {
      return { valid: false, error: 'Longitude is required' };
    }

    if (typeof longitude !== 'number') {
      return { valid: false, error: 'Longitude must be a number' };
    }

    if (longitude < -180 || longitude > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180' };
    }

    return { valid: true, error: null };
  }

  /**
   * Validate a coordinate pair [longitude, latitude]
   * @param {array} coordinate
   * @returns {object} { valid: boolean, error: string|null }
   */
  static validateCoordinate(coordinate) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) {
      return { valid: false, error: 'Coordinate must be an array [longitude, latitude]' };
    }

    const [lon, lat] = coordinate;

    if (typeof lon !== 'number' || typeof lat !== 'number') {
      return { valid: false, error: 'Longitude and latitude must be numbers' };
    }

    if (lon < -180 || lon > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180' };
    }

    if (lat < -90 || lat > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90' };
    }

    return { valid: true, error: null };
  }

  /**
   * Calculate center point of a polygon (centroid)
   * @param {object} polygon - GeoJSON Polygon
   * @returns {array} [longitude, latitude]
   */
  static calculateCentroid(polygon) {
    if (!polygon.coordinates || polygon.coordinates.length === 0) {
      return null;
    }

    const ring = polygon.coordinates[0]; // Use exterior ring
    let sumLon = 0;
    let sumLat = 0;

    for (let i = 0; i < ring.length - 1; i++) {
      sumLon += ring[i][0];
      sumLat += ring[i][1];
    }

    return [sumLon / (ring.length - 1), sumLat / (ring.length - 1)];
  }

  /**
   * Validate parcelle geospatial data
   * @param {object} data - Parcelle data object
   * @returns {object} { valid: boolean, errors: string[] }
   */
  static validateParcelleGeoData(data) {
    const errors = [];

    // Validate name
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Name is required and must be a non-empty string');
    }

    // Validate latitude
    const latValidation = this.validateLatitude(data.latitude);
    if (!latValidation.valid) {
      errors.push(latValidation.error);
    }

    // Validate longitude
    const lonValidation = this.validateLongitude(data.longitude);
    if (!lonValidation.valid) {
      errors.push(lonValidation.error);
    }

    // Validate polygon
    const polygonValidation = this.validatePolygon(data.polygon);
    if (!polygonValidation.valid) {
      errors.push(...polygonValidation.errors);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create a simple polygon from bounds (min/max latitude and longitude)
   * @param {number} minLat
   * @param {number} maxLat
   * @param {number} minLon
   * @param {number} maxLon
   * @returns {object} GeoJSON Polygon
   */
  static createPolygonFromBounds(minLat, maxLat, minLon, maxLon) {
    return {
      type: 'Polygon',
      coordinates: [
        [
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat], // Close the ring
        ],
      ],
    };
  }

  /**
   * Convert degrees to radians
   * @private
   */
  static _toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = GeoJSONValidator;
