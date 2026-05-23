const axios = require('axios');
const logger = require('../utils/logger');

const PLANET_API_KEY = process.env.PLANET_API_KEY;
const PLANET_API_BASE = process.env.PLANET_API_BASE_URL || 'https://api.planet.com/data/v1';

// Polygon format: [[lon, lat], [lon, lat], ...] (GeoJSON LinearRing)
class PlanetLabsClient {
  async searchImagery(polygon, filter = {}) {
    try {
      // In development mode, return mock satellite data
      if (process.env.NODE_ENV === 'development' || !PLANET_API_KEY) {
        logger.info('[Dev Mock] Returning mock satellite imagery data');
        return this._generateMockImageryResults(polygon, filter);
      }

      const searchPayload = this._buildSearchPayload(polygon, filter);
      
      const response = await this._makeRequest(
        'POST',
        '/searches/v1/landsat8l1g/search',
        searchPayload
      );

      logger.info('Imagery search completed', { 
        resultCount: response.features?.length || 0 
      });
      
      return response.features || [];
    } catch (error) {
      logger.error('Planet Labs imagery search failed', { message: error.message });
      // Fallback to mock data if API fails in dev mode
      if (process.env.NODE_ENV === 'development') {
        logger.info('[Dev Mock] Falling back to mock satellite imagery data');
        return this._generateMockImageryResults(polygon, filter);
      }
      throw error;
    }
  }

  async getImageData(itemId, assetType = 'ortho_analytic_4b') {
    try {
      // In development mode, return mock asset data
      if (process.env.NODE_ENV === 'development' || !PLANET_API_KEY) {
        logger.info('[Dev Mock] Returning mock image asset data', { itemId, assetType });
        return this._generateMockAssetData(itemId, assetType);
      }

      const response = await this._makeRequest(
        'GET',
        `/items/v1/${itemId}`,
        null
      );

      const assets = response.properties?.assets || response.assets || {};
      const asset = assets[assetType];

      if (!asset) {
        throw new Error(`Asset type ${assetType} not found for item ${itemId}`);
      }

      logger.info('Image asset found', { itemId, assetType, location: asset.location });
      return asset;
    } catch (error) {
      logger.error('Failed to get image data', { itemId, message: error.message });
      // Fallback to mock data if API fails in dev mode
      if (process.env.NODE_ENV === 'development') {
        logger.info('[Dev Mock] Falling back to mock asset data');
        return this._generateMockAssetData(itemId, assetType);
      }
      throw error;
    }
  }

  async activateAsset(itemId, assetType = 'ortho_analytic_4b') {
    try {
      // In development mode, mock asset activation
      if (process.env.NODE_ENV === 'development' || !PLANET_API_KEY) {
        logger.info('[Dev Mock] Asset activation requested (mocked)', { itemId, assetType });
        return { status: 'complete' };
      }

      const response = await this._makeRequest(
        'POST',
        `/items/v1/${itemId}/${assetType}/activate`,
        null
      );

      logger.info('Asset activation requested', { itemId, assetType });
      return response;
    } catch (error) {
      logger.error('Failed to activate asset', { itemId, message: error.message });
      // In dev mode, silently succeed
      if (process.env.NODE_ENV === 'development') {
        return { status: 'complete' };
      }
      throw error;
    }
  }

  async getAssetStatus(itemId, assetType = 'ortho_analytic_4b') {
    try {
      // In development mode, assume asset is ready
      if (process.env.NODE_ENV === 'development' || !PLANET_API_KEY) {
        logger.info('[Dev Mock] Asset status: ready (mocked)', { itemId, assetType });
        return { status: 'active' };
      }

      const response = await this._makeRequest(
        'GET',
        `/items/v1/${itemId}/${assetType}`,
        null
      );

      const status = response.status || response.state;
      logger.info('Asset status retrieved', { itemId, assetType, status });
      return { status, expiresAt: response.expires_at };
    } catch (error) {
      logger.error('Failed to get asset status', { itemId, message: error.message });
      throw error;
    }
  }

  // Retry logic for asset download
  async downloadAssetWithRetry(downloadUrl, maxRetries = 3, retryDelay = 5000) {
    // In development mode, return mock pixel data
    if (process.env.NODE_ENV === 'development' || !PLANET_API_KEY) {
      logger.info('[Dev Mock] Returning mock image data for asset');
      // Detect band type from URL and generate appropriate values
      const isBand4 = downloadUrl.includes('B4') || downloadUrl.includes('red');
      return this._generateMockImageBuffer(256, 256, isBand4 ? 'red' : 'nir');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Downloading asset (attempt ${attempt}/${maxRetries})`, { url: downloadUrl });
        
        const response = await axios.get(downloadUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            Authorization: `api-key ${PLANET_API_KEY}`
          }
        });

        logger.info('Asset downloaded successfully');
        return response.data;
      } catch (error) {
        if (attempt === maxRetries) {
          logger.error('Asset download failed after retries', { message: error.message });
          // In dev mode, fallback to mock data
          if (process.env.NODE_ENV === 'development') {
            logger.info('[Dev Mock] Falling back to mock image data');
            return this._generateMockImageBuffer(256, 256, 'nir');
          }
          throw error;
        }
        logger.warn(`Download failed, retrying in ${retryDelay}ms`, { attempt, error: error.message });
        await this._sleep(retryDelay);
      }
    }
  }

  // Helper method to build search payload
  _buildSearchPayload(polygon, filter) {
    const geoFilter = {
      type: 'GeometryFilter',
      field_name: 'geometry',
      config: {
        type: 'Polygon',
        coordinates: [polygon] // polygon is LinearRing, wrapped in array for Polygon
      }
    };

    const cloudFilter = {
      type: 'RangeFilter',
      field_name: 'cloud_cover',
      config: {
        lte: filter.maxCloudCover || 0.1 // 10% default
      }
    };

    const dateFilter = {
      type: 'DateRangeFilter',
      field_name: 'acquired',
      config: {
        gte: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lte: filter.endDate || new Date().toISOString()
      }
    };

    return {
      item_types: filter.itemTypes || ['Landsat8L1G'],
      filter: {
        type: 'AndFilter',
        config: [geoFilter, cloudFilter, dateFilter]
      }
    };
  }

  // Helper method for HTTP requests
  async _makeRequest(method, endpoint, data) {
    try {
      const url = `${PLANET_API_BASE}${endpoint}`;
      const config = {
        method,
        url,
        timeout: 30000,
        auth: {
          username: PLANET_API_KEY,
          password: '' // Empty password for API key auth
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      
      logger.error('Planet Labs API error', { 
        status, 
        message: errorMsg,
        endpoint 
      });

      const err = new Error(errorMsg);
      err.status = status;
      throw err;
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate mock satellite imagery results for development/testing
   */
  _generateMockImageryResults(polygon, filter = {}) {
    try {
      // Validate polygon structure
      if (!polygon || !polygon.coordinates || !Array.isArray(polygon.coordinates)) {
        logger.warn('[Dev Mock] Invalid polygon structure, using default coordinates', { polygon });
        // Use default coordinates if polygon is invalid
        const baseLatitude = 35.7595;
        const baseLongitude = 10.5855;
        polygon = {
          type: 'Polygon',
          coordinates: [[
            [baseLongitude - 0.1, baseLatitude - 0.1],
            [baseLongitude + 0.1, baseLatitude - 0.1],
            [baseLongitude + 0.1, baseLatitude + 0.1],
            [baseLongitude - 0.1, baseLatitude + 0.1],
            [baseLongitude - 0.1, baseLatitude - 0.1]
          ]]
        };
      }

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      
      // Extract center coordinates from polygon
      const coords = polygon.coordinates[0];
      const centerLon = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
      const centerLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;

      return [
        {
          type: 'Feature',
          id: `mock_ls8_${Date.now()}_1`,
          bbox: [centerLon - 0.1, centerLat - 0.1, centerLon + 0.1, centerLat + 0.1],
          geometry: polygon,
          properties: {
            acquired: twoDaysAgo.toISOString().split('T')[0],
            provider: 'Landsat8L1G',
            asset_type: 'ortho_analytic_4b',
            ground_control: true,
            instrument: 'OLI',
            cloud_cover: 0.05
          }
        },
        {
          type: 'Feature',
          id: `mock_ls8_${Date.now()}_2`,
          bbox: [centerLon - 0.1, centerLat - 0.1, centerLon + 0.1, centerLat + 0.1],
          geometry: polygon,
          properties: {
            acquired: oneDayAgo.toISOString().split('T')[0],
            provider: 'Landsat8L1G',
            asset_type: 'ortho_analytic_4b',
            ground_control: true,
            instrument: 'OLI',
            cloud_cover: 0.02
          }
        }
      ];
    } catch (error) {
      logger.error('[Dev Mock] Error generating mock imagery results', { error: error.message });
      // Return minimal valid mock data as fallback
      return [
        {
          type: 'Feature',
          id: `mock_fallback_${Date.now()}`,
          properties: {
            acquired: new Date().toISOString().split('T')[0],
            provider: 'Landsat8L1G',
            cloud_cover: 0.1
          }
        }
      ];
    }
  }

  /**
   * Generate mock asset data for development/testing
   */
  _generateMockAssetData(itemId, assetType) {
    // Return a mock asset with all required fields
    // Include band information in the location URL for development mode band detection
    return {
      type: 'Feature',
      id: itemId,
      itemID: itemId,
      itemType: 'Landsat8L1G',
      asset_type: assetType,
      status: 'active',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      location: `https://api.planet.com/mock/data/${itemId}_${assetType}_B5_nir.tiff`, // B5 is NIR band
      links: [{
        rel: 'data',
        href: `https://api.planet.com/mock/data/${itemId}_${assetType}_B5_nir.tiff`
      }],
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      permissions: ['download']
    };
  }

  /**
   * Generate mock satellite image pixel data buffer
   */





_generateMockImageBuffer(width = 256, height = 256, band = 'nir') {
  const buffer = Buffer.alloc(width * height * 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;

      let value;

      // 🧠 Create artificial zones based on position
      const zoneType =
        x < width / 3 ? 'healthy' :
        x < (2 * width) / 3 ? 'medium' :
        'stress';

      if (band === 'red') {
        if (zoneType === 'healthy') {
          value = 8000 + Math.random() * 2000; // low red
        } else if (zoneType === 'medium') {
          value = 12000 + Math.random() * 3000;
        } else {
          value = 18000 + Math.random() * 5000; // high red (bad)
        }
      } else {
        if (zoneType === 'healthy') {
          value = 45000 + Math.random() * 5000; // high NIR
        } else if (zoneType === 'medium') {
          value = 30000 + Math.random() * 5000;
        } else {
          value = 15000 + Math.random() * 5000; // low NIR (stress)
        }
      }

      buffer.writeUInt16LE(Math.floor(value), i * 2);
    }
  }

  return buffer;
}






  /*
  _generateMockImageBuffer(width = 256, height = 256, band = 'nir') {
    // Create a buffer for uint16 image data (2 bytes per pixel)
    const buffer = Buffer.alloc(width * height * 2);
    
    // Generate band-appropriate values
    // For healthy vegetation: NIR > RED
    // NIR: 40000-50000 (high for vegetation)
    // RED: 10000-18000 (lower for red wavelength)
    
    for (let i = 0; i < width * height; i++) {
      let value;
      
      if (band === 'red') {
        // Red band: lower values, 10000-18000
        const baseValue = 10000 + Math.random() * 80000;
        value = Math.floor(baseValue);
      } else {
        // NIR band: higher values, 40000-50000 (healthy vegetation has high NIR reflectance)
        const baseValue = 40000 + Math.random() * 10000;
        value = Math.floor(baseValue);
      }
      
      // Write as little-endian uint16
      buffer.writeUInt16LE(value, i * 2);
    }
    
    return buffer;
  }
  */
}

module.exports = new PlanetLabsClient();
