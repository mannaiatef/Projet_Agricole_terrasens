const axios = require('axios');
const logger = require('../utils/logger');

const CROP_CALENDAR_URL = process.env.CROP_CALENDAR_SERVICE_URL || 'http://localhost:3002';

class CropCalendarClient {
  /**
   * Fetch parcel data from crop-calendar-service
   * @param {number} parcelId - ID of the parcel
   * @returns {Object} Parcel data with polygon, coordinates, crop type
   */
  async getParcelData(parcelId) {
    try {
      const url = `${CROP_CALENDAR_URL}/parcelles/internal/${parcelId}`;
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info('Parcel data retrieved', { parcelId });
      
      // Validate/prepare parcel data
      const parcelData = this._validateAndPrepareParcelData(response.data, parcelId);
      
      return {
        parcelId: parcelData.id || parcelId,
        polygon: parcelData.polygon,
        coordinates: {
          latitude: parcelData.latitude,
          longitude: parcelData.longitude
        },
        cropType: parcelData.crop_type || parcelData.cropType,
        area: parcelData.surface || parcelData.area,
        name: parcelData.name,
        farmerId: parcelData.farmer_id || parcelData.farmerId,
        season: parcelData.season
      };
    } catch (error) {
      if (error.response?.status === 404) {
        logger.warn(`Parcel not found`, { parcelId });
        throw new Error(`Parcel ${parcelId} not found`);
      }
      
      logger.error('Failed to fetch parcel data', { parcelId, message: error.message });
      throw new Error(`Failed to fetch parcel data: ${error.message}`);
    }
  }

  /**
   * Fetch all parcels (for bulk analysis)
   */
  async getAllParcels() {
    try {
      const url = `${CROP_CALENDAR_URL}/parcelles/internal`;
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info('All parcels retrieved', { count: response.data.length || 0 });
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch all parcels', { message: error.message });
      throw error;
    }
  }

  /**
   * Get parcel geometry in GeoJSON format
   */
  async getParcelGeometry(parcelId) {
    try {
      const parcel = await this.getParcelData(parcelId);
      
      return {
        type: 'Feature',
        properties: {
          parcelId: parcel.parcelId,
          cropType: parcel.cropType,
          area: parcel.area
        },
        geometry: parcel.polygon
      };
    } catch (error) {
      logger.error('Failed to get parcel geometry', { parcelId, message: error.message });
      throw error;
    }
  }

  /**
   * Validate and prepare parcel data, generating mocks if needed (for dev environment)
   */
  _validateAndPrepareParcelData(data, parcelId) {
    // Generate name if not provided
    const name = data.name || `Parcel ${parcelId}`;

    // Generate mock coordinates if not provided
    const baseLatitude = 35.7595; // Tunisia default
    const baseLongitude = 10.5855;
    const latitude = data.latitude || baseLatitude + (parcelId * 0.01);
    const longitude = data.longitude || baseLongitude + (parcelId * 0.02);

    // Generate mock polygon (square around coordinates) if not provided
    const polygon = data.polygon || {
      type: 'Polygon',
      coordinates: [
        [
          [longitude - 0.01, latitude - 0.01],
          [longitude + 0.01, latitude - 0.01],
          [longitude + 0.01, latitude + 0.01],
          [longitude - 0.01, latitude + 0.01],
          [longitude - 0.01, latitude - 0.01]
        ]
      ]
    };

    return {
      ...data,
      name,
      latitude,
      longitude,
      polygon
    };
  }
}

module.exports = new CropCalendarClient();
