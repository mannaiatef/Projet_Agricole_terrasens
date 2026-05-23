const logger = require('../utils/logger');
const CropCalendarClient = require('./CropCalendarClient');
const PlanetLabsClient = require('./PlanetLabsClient');
const NDVIService = require('./NDVIService');
const GeoJSONService = require('./GeoJSONService');
const StressRecordRepository = require('../repositories/StressRecordRepository');
const StressZoneRepository = require('../repositories/StressZoneRepository');
const AlertRepository = require('../repositories/AlertRepository');

class StressAnalysisService {
  /**
   * Execute complete stress analysis for a parcel
   * 1. Fetch parcel data
   * 2. Search for latest satellite imagery
   * 3. Retrieve and process image bands
   * 4. Compute NDVI
   * 5. Detect stress zones
   * 6. Store results in database
   * 7. Trigger alerts if needed
   */
  async analyzeParcel(parcelId) {
    let recordId = null;

    try {
      logger.info('Starting stress analysis', { parcelId });

      // Create stress record
      recordId = await this._createStressRecord(parcelId);

      // Fetch parcel data
      const parcelData = await CropCalendarClient.getParcelData(parcelId);
      logger.info('Parcel data loaded', { parcelId, area: parcelData.area });

      // Update status to processing
      await StressRecordRepository.updateStatus(recordId, 'processing');

      // Search imagery - pass full polygon GeoJSON object, not just coordinates
      const imagery = await this._searchAndSelectImagery(parcelData.polygon);

      if (!imagery) {
        throw new Error('No suitable satellite imagery found');
      }

      logger.info('Imagery selected', { itemId: imagery.id, cloudCoverage: imagery.cloudCoverage });

      // Download image bands
      const bands = await this._downloadImageBands(imagery.id);

      if (!bands.nir || !bands.red) {
        throw new Error('Failed to download required image bands');
      }

      // Compute NDVI
      const ndviStats = NDVIService.computeNDVI(
        bands.nir,
        bands.red,
        imagery.width || 256,
        imagery.height || 256,
        bands.dataType || 2
      );

      logger.info('NDVI computed', { meanNdvi: ndviStats.meanNdvi.toFixed(4) });

      // Generate pixel stress map
      const pixelStressMap = NDVIService.generatePixelStressMap(
        ndviStats.validPixels || [],
        imagery.width || 512,  // UPGRADED: 256 → 512 for better resolution
        imagery.height || 512,
        imagery.geoTransform
      );

      // Generate NDVI heatmap (pixel-level visualization)
      const ndviHeatmap = GeoJSONService.generateNDVIHeatmap(pixelStressMap);
      
      // 🔴 CRITICAL DEBUG: Log heatmap before returning
      console.log(`[StressAnalysis] Heatmap generated: ${ndviHeatmap.features.length} features`);
      console.log(`[StressAnalysis] Heatmap type: ${ndviHeatmap.type}, features count: ${ndviHeatmap.features?.length || 0}`);
      
      // Generate stress zones (for reporting)
      const stressZones = GeoJSONService.generateStressZones(pixelStressMap, parcelData.polygon);

      // Store results
      await this._storeAnalysisResults(recordId, ndviStats, stressZones);

      // Update record with final data
      await StressRecordRepository.updateStatus(recordId, 'completed');
      await StressRecordRepository.updateAnalysisResults(recordId, {
        meanNdvi: ndviStats.meanNdvi,
        stressPercentage: ndviStats.stressPercentage,
        pixelCount: ndviStats.pixelCount,
        stressedPixelCount: ndviStats.stressedPixelCount
      });

      // Check for alerts
      await this._checkAndCreateAlerts(parcelId, recordId, ndviStats.stressPercentage);

      logger.info('Stress analysis completed successfully', { 
        parcelId, 
        recordId,
        stressPercentage: ndviStats.stressPercentage.toFixed(2)
      });

      return {
        recordId,
        parcelId,
        ndviStats,
        zones: stressZones,
        heatmap: ndviHeatmap,
        pixelStressMap: pixelStressMap,
        zoneCount: stressZones.length,
        pixelCount: pixelStressMap.length,
        stressPercentage: ndviStats.stressPercentage
      };
    } catch (error) {
      logger.error('Stress analysis failed', { parcelId, recordId, message: error.message });
      
      if (recordId) {
        await StressRecordRepository.updateStatus(recordId, 'failed', error.message);
      }

      throw error;
    }
  }

  /**
   * Get latest stress analysis for a parcel
   */
  async getLatestAnalysis(parcelId) {
    try {
      const record = await StressRecordRepository.getLatestByParcelId(parcelId);

      if (!record) {
        return null;
      }

      const zones = await StressZoneRepository.getByRecordId(record.id);
      const alerts = await AlertRepository.getAlertsByRecordId(record.id);
      const zonesSummary = await StressZoneRepository.getStressZonesSummary(record.id);

      // 🔴 CRITICAL FIX: Generate or retrieve heatmap
      // For now, generate from zones if heatmap is not stored
      let heatmap = null;
      
      // Try to reconstruct heatmap from zones (fallback)
      if (zones && zones.length > 0) {
        heatmap = this._generateHeatmapFromZones(zones);
        console.log('[StressAnalysisService] Heatmap reconstructed from zones:', heatmap?.features?.length || 0);
      }

      return {
        record,
        zones,
        alerts,
        summary: zonesSummary,
        heatmap: heatmap
      };
    } catch (error) {
      logger.error('Failed to fetch latest analysis', { parcelId, message: error.message });
      throw error;
    }
  }

  /**
   * Generate heatmap from zones (fallback when pixel data not stored)
   */
  _generateHeatmapFromZones(zones) {
    if (!zones || zones.length === 0) return null;

    // Convert zones back to point features for heatmap
    const features = [];
    
    zones.forEach(zone => {
      // Parse zone geometry
      try {
        const geometry = typeof zone.geojson === 'string' ? JSON.parse(zone.geojson) : zone.geojson;
        
        if (geometry.type === 'FeatureCollection' && geometry.features) {
          geometry.features.forEach(feature => {
            if (feature.geometry.type === 'Point') {
              features.push({
                type: 'Feature',
                properties: {
                  ndvi: zone.mean_ndvi_in_zone,
                  stressLevel: zone.stress_level,
                  nir: 0, // Not available in zone data
                  red: 0  // Not available in zone data
                },
                geometry: feature.geometry
              });
            }
          });
        }
      } catch (e) {
        console.warn('[StressAnalysisService] Failed to parse zone geometry:', e.message);
      }
    });

    return {
      type: 'FeatureCollection',
      features: features
    };
  }

  /**
   * Get all analyses for a parcel
   */
  async getParcelAnalysisHistory(parcelId, limit = 50) {
    try {
      const records = await StressRecordRepository.getAllByParcelId(parcelId, limit);
      return records;
    } catch (error) {
      logger.error('Failed to fetch analysis history', { parcelId, message: error.message });
      throw error;
    }
  }

  // Private helper methods

  async _createStressRecord(parcelId) {
    const record = await StressRecordRepository.create(parcelId, {
      status: 'pending'
    });
    return record.id;
  }

  async _searchAndSelectImagery(polygon) {
    try {
      const results = await PlanetLabsClient.searchImagery(polygon, {
        maxCloudCover: 0.15,
        itemTypes: ['Landsat8L1G', 'PSScene']
      });

      if (results.length === 0) {
        return null;
      }

      // Select imagery with lowest cloud coverage
      const selected = results.reduce((best, current) => {
        const cloudCover = current.properties?.cloud_cover || 1;
        const bestCloudCover = best.properties?.cloud_cover || 1;
        return cloudCover < bestCloudCover ? current : best;
      });

      // Calculate geoTransform from polygon bounds
      const geoTransform = this._calculateGeoTransformFromPolygon(polygon);
      console.log('[StressAnalysis] GeoTransform calculated:', geoTransform);

      return {
        id: selected.id,
        itemType: selected.properties?.item_type,
        cloudCoverage: selected.properties?.cloud_cover,
        imageryDate: selected.properties?.acquired,
        width: 256,
        height: 256,
        geoTransform: geoTransform,
        bounds: selected.properties?.bounds || polygon.coordinates?.[0]
      };
    } catch (error) {
      logger.error('Failed to search imagery', { message: error.message });
      throw error;
    }
  }

  /**
   * Calculate geoTransform from parcel polygon bounds
   * geoTransform = [minLon, pixelWidth, 0, maxLat, 0, -pixelHeight]
   */
  _calculateGeoTransformFromPolygon(polygon) {
    if (!polygon || !polygon.coordinates || polygon.coordinates.length === 0) {
      console.warn('[StressAnalysis] Invalid polygon, using default geoTransform');
      return [0, 1, 0, 1, 0, 1];
    }

    const coords = polygon.coordinates[0]; // exterior ring
    const lons = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);

    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const width = 256;
    const height = 256;

    const pixelWidth = (maxLon - minLon) / width;
    const pixelHeight = (maxLat - minLat) / height;

    // geoTransform format: [minLon, pixelWidth, 0, maxLat, 0, -pixelHeight]
    return [minLon, pixelWidth, 0, maxLat, 0, -pixelHeight];
  }

  async _downloadImageBands(itemId) {
    try {
      // Get asset information
      const nirAsset = await PlanetLabsClient.getImageData(itemId, 'ortho_analytic_4b_sr');
      const redAsset = await PlanetLabsClient.getImageData(itemId, 'ortho_analytic_4b_sr');

      // Use asset location or fallback to a generated one for dev mode
      // Include band identifiers in development URLs for correct mock generation
      let nirLocation, redLocation;
      
      if (process.env.NODE_ENV === 'development') {
        // In dev mode, use explicit band URLs without relying on asset.location
        nirLocation = `https://api.planet.com/dev/${itemId}_B5_nir.tiff`;
        redLocation = `https://api.planet.com/dev/${itemId}_B4_red.tiff`;
      } else {
        // In production, use asset locations
        nirLocation = nirAsset.location || `https://api.planet.com/dev/nir_${itemId}.tiff`;
        redLocation = redAsset.location || `https://api.planet.com/dev/red_${itemId}.tiff`;
      }

      if (!nirAsset.location || !redAsset.location) {
        logger.warn('Assets not immediately available, requesting activation', { itemId });
        await PlanetLabsClient.activateAsset(itemId, 'ortho_analytic_4b_sr');
        
        // In dev mode, we already have a location, so skip waiting
        if (process.env.NODE_ENV === 'development') {
          logger.info('[Dev Mock] Skipping asset activation wait for development');
        } else {
          // Wait for activation in production
          await this._waitForAssetActivation(itemId, 'ortho_analytic_4b_sr');
        }
      }

      // Download bands with retry
      const nirBuffer = await PlanetLabsClient.downloadAssetWithRetry(nirLocation);
      const redBuffer = await PlanetLabsClient.downloadAssetWithRetry(redLocation);

      return {
        nir: nirBuffer,
        red: redBuffer,
        dataType: 2 // uint16
      };
    } catch (error) {
      logger.error('Failed to download image bands', { itemId, message: error.message });
      throw error;
    }
  }

  async _waitForAssetActivation(itemId, assetType, maxWaitTime = 300000) {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await PlanetLabsClient.getAssetStatus(itemId, assetType);
        
        if (status.status === 'active' || status.status === 'inactive') {
          logger.info('Asset ready', { itemId, assetType, status: status.status });
          return true;
        }

        logger.info('Asset activation in progress', { itemId, status: status.status });
        await this._sleep(pollInterval);
      } catch (error) {
        logger.warn('Error checking asset status', { message: error.message });
        await this._sleep(pollInterval);
      }
    }

    throw new Error('Asset activation timeout');
  }

  async _storeAnalysisResults(recordId, ndviStats, stressZones) {
    try {
      if (stressZones.length > 0) {
        await StressZoneRepository.create(recordId, stressZones);
      }
      logger.info('Analysis results stored', { recordId, zoneCount: stressZones.length });
    } catch (error) {
      logger.error('Failed to store analysis results', { recordId, message: error.message });
      throw error;
    }
  }

  async _checkAndCreateAlerts(parcelId, recordId, stressPercentage) {
    try {
      const threshold = parseFloat(process.env.STRESS_ALERT_THRESHOLD || 30);

      if (stressPercentage > threshold) {
        await AlertRepository.create(parcelId, recordId, {
          alertType: 'high_stress_detected',
          severity: stressPercentage > 60 ? 'high' : 'medium',
          message: `High vegetation stress detected: ${stressPercentage.toFixed(2)}% of parcel affected`
        });

        logger.warn('High stress alert created', { parcelId, stressPercentage });
      }
    } catch (error) {
      logger.error('Failed to create alerts', { parcelId, message: error.message });
      // Don't throw - alerts are non-critical
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new StressAnalysisService();
