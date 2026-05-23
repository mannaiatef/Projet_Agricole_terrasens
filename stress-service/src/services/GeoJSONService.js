const logger = require('../utils/logger');

class GeoJSONService {
  /**
   * Convert stressed pixel clusters into GeoJSON polygons
   * Creates detailed zones based on NDVI values instead of grouping all pixels
   * Each cluster represents pixels with similar NDVI values for better visualization
   */
  generateStressZones(pixelStressMap, parcelPolygon) {
    try {
      logger.info('Generating GeoJSON stress zones', { pixelCount: pixelStressMap.length });
      console.log("ZONES COUNT:", pixelStressMap.length);

      // Create zones by clustering pixels with similar NDVI values
      // Instead of grouping all high/medium into 2 zones, create smaller clusters
      const zones = this._createDetailedNDVIZones(pixelStressMap);

      logger.info('GeoJSON zones generated', { zoneCount: zones.length });
      console.log("ZONES COUNT:", zones.length);
      return zones;
    } catch (error) {
      logger.error('Failed to generate GeoJSON zones', { message: error.message });
      throw error;
    }
  }

  /**
   * Create detailed zones by clustering pixels with spatial proximity AND similar NDVI
   * Avoids oversimplification and preserves spatial variation
   */
  _createDetailedNDVIZones(pixelStressMap) {
    if (pixelStressMap.length === 0) return [];

    const zones = [];
    const processed = new Set();
    const MAX_DISTANCE = 0.01; // Maximum distance between pixels in same cluster (in degrees)
    const NDVI_RANGE = 0.1;   // Maximum NDVI difference in same cluster

    console.log('[GeoJSON] Starting detailed NDVI zone creation from', pixelStressMap.length, 'pixels');

    // Use grid-based clustering for efficiency
    const grid = this._buildPixelGrid(pixelStressMap);

    for (let i = 0; i < pixelStressMap.length; i++) {
      if (processed.has(i)) continue;

      const seedPixel = pixelStressMap[i];
      const cluster = [seedPixel];
      processed.add(i);

      // Find spatially adjacent pixels with similar NDVI
      const neighbors = this._findSpatialNeighbors(
        seedPixel,
        pixelStressMap,
        processed,
        MAX_DISTANCE,
        NDVI_RANGE
      );

      cluster.push(...neighbors);

      // Create zone if cluster has minimum size (10+ pixels for meaningful zones)
      if (cluster.length >= 10) {
        const zone = this._createStressZone(cluster, seedPixel.stressLevel, null);
        if (zone) {
          zones.push(zone);
          // 🔴 CRITICAL FIX: Log the stressLevel for debugging
          console.log('[GeoJSON] Zone created:', {
            pixelCount: cluster.length,
            meanNdvi: zone.mean_ndvi_in_zone.toFixed(4),
            stressLevel: seedPixel.stressLevel,  // ← Log stress classification!
            zoneIndex: zones.length
          });
          logger.info('[GeoJSON] Stress zone classified', {
            zoneIndex: zones.length,
            pixelCount: cluster.length,
            stressLevel: seedPixel.stressLevel,
            meanNdvi: zone.mean_ndvi_in_zone.toFixed(4)
          });
        }
      }
    }

    console.log('[GeoJSON] Detailed zone creation complete. Zones:', zones.length);
    return zones;
  }

  /**
   * Build spatial grid for efficient neighbor lookup
   */
  _buildPixelGrid(pixelStressMap) {
    const grid = new Map();
    const GRID_CELL_SIZE = 0.05; // 0.05 degree cells

    for (const pixel of pixelStressMap) {
      const cellKey = this._getGridCellKey(pixel.longitude, pixel.latitude, GRID_CELL_SIZE);
      if (!grid.has(cellKey)) {
        grid.set(cellKey, []);
      }
      grid.get(cellKey).push(pixel);
    }

    return grid;
  }

  /**
   * Get grid cell key for a coordinate
   */
  _getGridCellKey(lon, lat, cellSize) {
    const x = Math.floor(lon / cellSize);
    const y = Math.floor(lat / cellSize);
    return `${x},${y}`;
  }

  /**
   * Find spatially adjacent pixels with similar NDVI
   */
  _findSpatialNeighbors(seedPixel, allPixels, processed, maxDistance, ndviRange) {
    const neighbors = [];
    const GRID_CELL_SIZE = 0.05;

    // Check neighboring grid cells
    const cellX = Math.floor(seedPixel.longitude / GRID_CELL_SIZE);
    const cellY = Math.floor(seedPixel.latitude / GRID_CELL_SIZE);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighborKey = `${cellX + dx},${cellY + dy}`;
        // Would need grid reference here - simplified for now
      }
    }

    // Linear search with distance filter
    for (let i = 0; i < allPixels.length; i++) {
      if (processed.has(i)) continue;

      const pixel = allPixels[i];
      const distance = Math.sqrt(
        Math.pow(pixel.longitude - seedPixel.longitude, 2) +
        Math.pow(pixel.latitude - seedPixel.latitude, 2)
      );

      // Check both distance and NDVI similarity
      if (distance <= maxDistance && Math.abs(pixel.ndvi - seedPixel.ndvi) <= ndviRange) {
        neighbors.push(pixel);
        processed.add(i);
      }
    }

    return neighbors;
  }

  /**
   * Create a GeoJSON FeatureCollection with stress zones
   */
  createFeatureCollection(zones) {
    return {
      type: 'FeatureCollection',
      features: zones.map(zone => ({
        type: 'Feature',
        properties: {
          stressLevel: zone.stressLevel,
          meanNdvi: zone.meanNdviInZone,
          pixelCount: zone.pixelCount,
          zoneArea: zone.zoneArea,
          created_at: new Date().toISOString()
        },
        geometry: zone.geojson
      }))
    };
  }

  /**
   * Create a single stress zone from grouped pixels
   * Uses convex hull for better boundary definition
   * IMPORTANT: Includes stressLevel in GeoJSON properties for frontend mapping
   */
  _createStressZone(pixels, stressLevel, parcelPolygon) {
    if (pixels.length === 0) {
      return null;
    }

    const coordinates = pixels.map(p => [p.longitude, p.latitude]);
    
    // Use convex hull for better boundary visualization
    const hull = this._computeConvexHull(coordinates);

    // Validate hull has at least 3 unique points
    if (hull.length < 4) {
      // If hull too small, create a small buffer around points
      return null;
    }

    // Calculate metrics using actual NDVI values
    const meanNdvi = pixels.reduce((sum, p) => sum + p.ndvi, 0) / pixels.length;
    const zoneArea = this._calculateAreaFromPixels(hull);

    // 🔴 CRITICAL FIX: Include stressLevel in GeoJSON properties for frontend color mapping
    const geojsonFeature = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [hull]
      },
      properties: {
        stressLevel: stressLevel,        // ← Frontend expects this!
        stress_level: stressLevel,       // ← Also support snake_case
        meanNdvi: meanNdvi,
        mean_ndvi_in_zone: meanNdvi,
        pixelCount: pixels.length,
        pixel_count: pixels.length,
        zoneArea: zoneArea,
        zone_area: zoneArea,
        minNdvi: Math.min(...pixels.map(p => p.ndvi)),
        maxNdvi: Math.max(...pixels.map(p => p.ndvi))
      }
    };

    return {
      stressLevel,
      geojson: geojsonFeature.geometry,  // Store just geometry in DB
      pixelCount: pixels.length,
      meanNdviInZone: meanNdvi,
      mean_ndvi_in_zone: meanNdvi,
      zoneArea,
      zone_area: zoneArea,
      minNdvi: Math.min(...pixels.map(p => p.ndvi)),
      maxNdvi: Math.max(...pixels.map(p => p.ndvi))
    };
  }

  /**
   * Compute convex hull from points using Graham's scan algorithm
   * Returns ordered array of [lon, lat] coordinates
   */
  _computeConvexHull(points) {
    if (points.length <= 3) {
      return points;
    }

    // Sort points by x coordinate (longitude)
    const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    // Build lower hull
    const lower = [];
    for (let i = 0; i < sorted.length; i++) {
      while (lower.length >= 2 && this._crossProduct(lower[lower.length - 2], lower[lower.length - 1], sorted[i]) <= 0) {
        lower.pop();
      }
      lower.push(sorted[i]);
    }

    // Build upper hull
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      while (upper.length >= 2 && this._crossProduct(upper[upper.length - 2], upper[upper.length - 1], sorted[i]) <= 0) {
        upper.pop();
      }
      upper.push(sorted[i]);
    }

    // Remove last point of each half because it's repeated
    lower.pop();
    upper.pop();

    // Return hull (add first point at end to close polygon)
    const hull = lower.concat(upper);
    hull.push(hull[0]);
    return hull;
  }

  /**
   * Calculate cross product for convex hull
   */
  _crossProduct(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }

  /**
   * Calculate approximate area of polygon in square degrees
   * For accurate results, use proper map projection
   */
  _calculateAreaFromPixels(coordinates) {
    if (coordinates.length < 3) return 0;

    // Shoelace formula (simplified - not accounting for projection)
    let area = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      area += (coordinates[i + 1][0] - coordinates[i][0]) * (coordinates[i + 1][1] + coordinates[i][1]);
    }
    area += (coordinates[0][0] - coordinates[coordinates.length - 1][0]) * (coordinates[0][1] + coordinates[coordinates.length - 1][1]);

    return Math.abs(area / 2);
  }

  /**
   * Create a simple bounding box around all stress pixels
   */
  createBoundingBox(pixels) {
    if (pixels.length === 0) {
      return null;
    }

    const lons = pixels.map(p => p.longitude);
    const lats = pixels.map(p => p.latitude);

    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    return {
      type: 'Polygon',
      coordinates: [[
        [minLon, minLat],
        [maxLon, minLat],
        [maxLon, maxLat],
        [minLon, maxLat],
        [minLon, minLat]
      ]]
    };
  }

  /**
   * Generate heatmap-style GeoJSON with pixel-level NDVI values
   */
  generateNDVIHeatmap(pixelStressMap) {
    const features = pixelStressMap.map(pixel => ({
      type: 'Feature',
      properties: {
        ndvi: pixel.ndvi,
        stressLevel: pixel.stressLevel,
        nir: pixel.nir,
        red: pixel.red
      },
      geometry: {
        type: 'Point',
        coordinates: [pixel.longitude, pixel.latitude]
      }
    }));

    // 🔴 CRITICAL DEBUG: Log heatmap generation
    console.log(`[GeoJSONService] Generated heatmap with ${features.length} pixels`);
    if (features.length > 0) {
      console.log('[GeoJSONService] HEATMAP SAMPLE FEATURES:');
      console.log('  First pixel:', JSON.stringify(features[0], null, 2));
      console.log('  Last pixel:', JSON.stringify(features[features.length - 1], null, 2));
      
      // Check coordinate bounds
      const lons = features.map(f => f.geometry.coordinates[0]);
      const lats = features.map(f => f.geometry.coordinates[1]);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      console.log(`[GeoJSONService] HEATMAP BOUNDS: lon [${minLon.toFixed(4)}, ${maxLon.toFixed(4)}], lat [${minLat.toFixed(4)}, ${maxLat.toFixed(4)}]`);
    }

    const heatmap = {
      type: 'FeatureCollection',
      features: features
    };

    return heatmap;
  }
}

module.exports = new GeoJSONService();
