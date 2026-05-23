const logger = require('../utils/logger');
const CropCalendarClient = require('./CropCalendarClient');
const StressAnalysisService = require('./StressAnalysisService');
const GeoJSONService = require('./GeoJSONService');

/**
 * MapService
 * Provides GIS map data for parcel visualization
 * Combines parcel geometry, stress analysis, and GeoJSON formatting
 */
class MapService {
  /**
   * Get complete map data for a parcel
   * Includes: polygon geometry, stress zones, center coordinates, optional tile URLs
   * 
   * @param {number} parcelId - Parcel ID
   * @returns {Promise<Object>} Map data object with polygon, zones, center, ndviTileUrl
   */
  async getParcelMapData(parcelId) {
    try {
      logger.info('Fetching parcel map data', { parcelId });
      console.log('[MapService] Fetching parcel:', parcelId);

      // Fetch parcel data
      const parcelData = await CropCalendarClient.getParcelData(parcelId);
      logger.info('Parcel data loaded', { parcelId, cropType: parcelData.cropType });

      // Fetch latest stress analysis
      const analysis = await StressAnalysisService.getLatestAnalysis(parcelId);
      if (analysis?.zones) {
        console.log('[MapService] Analysis zones:', analysis.zones.length);
      }
      
      // Extract polygon coordinates
      const polygon = this._extractPolygonGeometry(parcelData);
      
      // Process stress zones into GeoJSON features (for reporting/fallback)
      const zones = this._formatStressZonesAsGeoJSON(analysis?.zones || []);
      
      // Use pixel-level heatmap if available, fallback to synthetic heatmap
      let heatmapData = analysis?.heatmap;
      
      // If no heatmap from analysis, generate synthetic one from stress record
      if (!heatmapData && analysis?.record) {
        console.log('[MapService] Generating synthetic heatmap from stress record...');
        heatmapData = this._generateSyntheticHeatmapFromRecord(
          parcelData.polygon,
          analysis.record,
          32  // 32x32 grid = 1024 pixels (fast, visible)
        );
      }
      
      // 🔴 CRITICAL DEBUG: Log heatmap in MapService
      console.log(`[MapService] Heatmap data available: ${heatmapData ? 'YES' : 'NO'}`);
      if (heatmapData?.features) {
        console.log(`[MapService] Heatmap features count: ${heatmapData.features.length}`);
      }
      if (!heatmapData) {
        console.log('[MapService] ⚠️ HEATMAP IS NULL - analysis:', {
          hasAnalysis: !!analysis,
          hasHeatmap: !!analysis?.heatmap,
          hasRecord: !!analysis?.record,
          stressPercentage: analysis?.record?.stress_percentage
        });
      }
      
      // Calculate center point from polygon
      const center = this._calculatePolygonCenter(parcelData.polygon);
      
      // Get optional NDVI tile URL (if configured)
      const ndviTileUrl = await this._getNDVITileUrl(parcelData, analysis);
      
      // Calculate bounds for map initialization
      const bounds = this._calculateBounds(parcelData.polygon);
      
      const mapData = {
        polygon: polygon,
        zones: zones,
        heatmap: heatmapData,
        center: center,
        bounds: bounds,
        parcelInfo: {
          id: parcelData.parcelId,
          name: parcelData.name,
          cropType: parcelData.cropType,
          area: parcelData.area,
          farmerId: parcelData.farmerId
        },
        analysis: analysis ? {
          recordId: analysis.record?.id,
          meanNdvi: analysis.record?.mean_ndvi,
          stressPercentage: analysis.record?.stress_percentage,
          imageryDate: analysis.record?.imagery_date,
          cloudCoverage: analysis.record?.cloud_coverage,
          zoneCount: analysis.zones?.length || 0
        } : null,
        ndviTileUrl: ndviTileUrl || null,
        timestamp: new Date().toISOString()
      };

      logger.info('Map data prepared successfully', {
        parcelId,
        zoneCount: zones.length,
        hasTiles: !!ndviTileUrl
      });

      return mapData;
    } catch (error) {
      logger.error('Failed to get parcel map data', {
        parcelId,
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Extract parcel polygon as a GeoJSON Feature
   * @private
   */
  _extractPolygonGeometry(parcelData) {
    return {
      type: 'Feature',
      properties: {
        parcelId: parcelData.parcelId,
        name: parcelData.name,
        cropType: parcelData.cropType,
        area: parcelData.area,
        fillColor: '#1976d2',
        strokeColor: '#0d47a1',
        fillOpacity: 0.1,
        strokeWeight: 2
      },
      geometry: parcelData.polygon
    };
  }

  /**
   * Format stress zones into GeoJSON features with NDVI-based coloring
   * @private
   */
  _formatStressZonesAsGeoJSON(zones) {
    return zones.map(zone => {
      const meanNdvi = zone.mean_ndvi_in_zone || zone.meanNdviInZone || 0;
      const stressLevel = zone.stress_level || zone.stressLevel || 'healthy';
      const color = this._getColorFromNDVI(meanNdvi);
      
      return {
        type: 'Feature',
        properties: {
          zoneId: zone.id,
          stressLevel: stressLevel,
          meanNdvi: meanNdvi,
          pixelCount: zone.pixel_count || zone.pixelCount,
          zoneArea: zone.zone_area || zone.zoneArea,
          fillColor: color,
          fillOpacity: 0.6,
          strokeColor: color,
          strokeWeight: 2,
          label: this._getLabelForStressLevel(stressLevel)
        },
        geometry: zone.geojson || {
          type: zone.type || 'Polygon',
          coordinates: zone.coordinates
        }
      };
    });
  }

  /**
   * Calculate the center point of a polygon (GeoJSON)
   * Uses the mean of all coordinate pairs
   * @private
   */
  _calculatePolygonCenter(polygon) {
    if (!polygon || !polygon.coordinates || polygon.coordinates.length === 0) {
      return { lat: 0, lng: 0 };
    }

    const coords = polygon.coordinates[0]; // First ring (exterior)
    
    let sumLat = 0;
    let sumLng = 0;
    
    for (const coord of coords) {
      sumLng += coord[0]; // longitude first in GeoJSON
      sumLat += coord[1]; // latitude second
    }
    
    return {
      lat: sumLat / coords.length,
      lng: sumLng / coords.length
    };
  }

  /**
   * Calculate bounding box for the polygon
   * Returns [minLat, minLng, maxLat, maxLng]
   * @private
   */
  _calculateBounds(polygon) {
    if (!polygon || !polygon.coordinates || polygon.coordinates.length === 0) {
      return [[0, 0], [0, 0]];
    }

    const coords = polygon.coordinates[0];
    
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const coord of coords) {
      const lng = coord[0];
      const lat = coord[1];
      
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }

    return [[minLat, minLng], [maxLat, maxLng]];
  }

  /**
   * Get NDVI tile URL (optional, requires tile service)
   * Placeholder for future integration with Planet Labs, Sentinel Hub, etc.
   * @private
   */
  async _getNDVITileUrl(parcelData, analysis) {
    try {
      // Check if NDVI tiles are enabled
      const tilesEnabled = process.env.NDVI_TILES_ENABLED === 'true';
      if (!tilesEnabled) {
        return null;
      }

      // Example: Sentinel Hub NDVI tiles (requires proper configuration)
      // const sentinelHubUrl = process.env.SENTINEL_HUB_TILE_URL;
      // if (sentinelHubUrl && analysis?.record?.imagery_date) {
      //   return `${sentinelHubUrl}/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&...`;
      // }

      // Example: Planet Labs tile URL (requires API key and subscription)
      // const planetApiKey = process.env.PLANET_API_KEY;
      // if (planetApiKey) {
      //   return `https://tiles.planet.com/data/v1/...`;
      // }

      return null;
    } catch (error) {
      logger.warn('Failed to get NDVI tile URL', { message: error.message });
      return null;
    }
  }

  /**
   * Get color from NDVI value for visualization
   * @private
   */
  _getColorFromNDVI(ndvi) {
    if (ndvi < 0.3) return '#F44336';   // red (high stress)
    if (ndvi < 0.4) return '#FF9800';   // orange (medium)
    return '#4CAF50';                   // green (healthy)
  }

  /**
   * Get color for stress level visualization (legacy, kept for compatibility)
   * @private
   */
  _getColorForStressLevel(stressLevel) {
    const colors = {
      'high': '#F44336',      // Red
      'medium': '#FF9800',     // Orange
      'healthy': '#4CAF50'     // Green
    };
    return colors[stressLevel] || '#9E9E9E'; // Gray for unknown
  }

  /**
   * Get readable label for stress level
   * @private
   */
  _getLabelForStressLevel(stressLevel) {
    const labels = {
      'high': 'High Stress',
      'medium': 'Medium Stress',
      'healthy': 'Healthy'
    };
    return labels[stressLevel] || 'Unknown';
  }

  /**
   * Generate heatmap data from zones for visualization
   * @private
   */
  _generateHeatmapFromZones(zones) {
    if (!zones || zones.length === 0) return null;

    // Create feature collection for heatmap layer
    return {
      type: 'FeatureCollection',
      features: zones.map(zone => {
        const meanNdvi = zone.mean_ndvi_in_zone || zone.meanNdviInZone || 0;
        const color = this._getColorFromNDVI(meanNdvi);

        return {
          type: 'Feature',
          properties: {
            intensity: meanNdvi,  // For heatmap intensity
            stressLevel: zone.stress_level || zone.stressLevel,
            meanNdvi: meanNdvi,
            pixelCount: zone.pixel_count || zone.pixelCount || 0,
            zoneArea: zone.zone_area || zone.zoneArea || 0,
            color: color
          },
          geometry: zone.geojson || {
            type: 'Polygon',
            coordinates: zone.coordinates
          }
        };
      })
    };
  }

  /**
   * Get historical map data (for time slider feature)
   * @param {number} parcelId - Parcel ID
   * @param {number} limit - Number of historical records to fetch
   * @returns {Promise<Array>} Array of map data objects with timestamps
   */
  async getParcelMapHistory(parcelId, limit = 10) {
    try {
      logger.info('Fetching parcel map history', { parcelId, limit });

      const parcelData = await CropCalendarClient.getParcelData(parcelId);
      const history = await StressAnalysisService.getParcelAnalysisHistory(parcelId, limit);

      const historyMapData = history.map(record => {
        const zones = record.zones ? this._formatStressZonesAsGeoJSON(record.zones) : [];
        
        return {
          recordId: record.id,
          polygon: this._extractPolygonGeometry(parcelData),
          zones: zones,
          center: this._calculatePolygonCenter(parcelData.polygon),
          analysis: {
            recordId: record.id,
            meanNdvi: record.mean_ndvi,
            stressPercentage: record.stress_percentage,
            imageryDate: record.imagery_date,
            cloudCoverage: record.cloud_coverage,
            zoneCount: zones.length
          },
          timestamp: record.created_at
        };
      });

      logger.info('Map history prepared', {
        parcelId,
        recordCount: historyMapData.length
      });

      return historyMapData;
    } catch (error) {
      logger.error('Failed to get parcel map history', {
        parcelId,
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Generate synthetic heatmap from stress record
   * Creates a grid-based heatmap with NDVI values based on stress percentage
   * Used as fallback when pixel-level data is unavailable
   * @private
   */
  _generateSyntheticHeatmapFromRecord(polygon, record, gridSize = 32) {
    if (!polygon || !polygon.coordinates || polygon.coordinates.length === 0) {
      console.warn('[MapService] Cannot generate synthetic heatmap - no polygon');
      return null;
    }

    try {
      // Extract polygon bounds
      const coords = polygon.coordinates[0];
      const lons = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);

      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      const stressPercentage = parseFloat(record.stress_percentage) || 0;
      const meanNdvi = parseFloat(record.mean_ndvi) || 0;

      // Convert stress percentage to NDVI distribution
      // High stress (100%) → many pixels with low NDVI (0.2)
      // Low stress (0%) → most pixels with high NDVI (0.7)
      const healthyPixelPercentage = (100 - stressPercentage) / 100;

      // Generate grid of pixels
      const features = [];
      const pixelWidth = (maxLon - minLon) / gridSize;
      const pixelHeight = (maxLat - minLat) / gridSize;

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          // Add random variation so not all pixels are identical
          const randomStress = Math.random();
          const isStressed = randomStress > healthyPixelPercentage;

          // NDVI distribution: stressed pixels get low NDVI, healthy get high NDVI
          let ndvi;
          if (isStressed) {
            // Stressed: NDVI between 0.15 and 0.40
            ndvi = 0.15 + Math.random() * 0.25;
          } else {
            // Healthy: NDVI between 0.50 and 0.75
            ndvi = 0.50 + Math.random() * 0.25;
          }

          const lon = minLon + col * pixelWidth + pixelWidth / 2;
          const lat = maxLat - row * pixelHeight - pixelHeight / 2;  // maxLat because lat decreases going south

          features.push({
            type: 'Feature',
            properties: {
              ndvi: ndvi,
              stressLevel: ndvi < 0.35 ? 'high' : ndvi < 0.45 ? 'medium' : 'healthy',
              nir: Math.random() * 5000,  // Synthetic NIR
              red: Math.random() * 3000   // Synthetic Red
            },
            geometry: {
              type: 'Point',
              coordinates: [lon, lat]
            }
          });
        }
      }

      const heatmap = {
        type: 'FeatureCollection',
        features: features
      };

      console.log(`[MapService] Generated synthetic heatmap: ${features.length} pixels (${gridSize}x${gridSize} grid)`);
      console.log(`[MapService] Stress: ${stressPercentage}%, Mean NDVI: ${meanNdvi}`);

      return heatmap;
    } catch (error) {
      console.error('[MapService] Failed to generate synthetic heatmap:', error);
      return null;
    }
  }
}

module.exports = new MapService();
