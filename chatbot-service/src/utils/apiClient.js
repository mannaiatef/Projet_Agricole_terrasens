const axios = require('axios');

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://api-gateway:3000';

class APIClient {
  constructor(baseURL = API_GATEWAY_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
    });
  }

  async getStress(parcelleId, token) {
    try {
      const response = await this.client.get(`/api/stress/parcel/${parcelleId}/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stress data:', error.message);
      throw new Error(`Failed to get stress data: ${error.message}`);
    }
  }

  async getIrrigationStatus(parcelleId, token) {
    try {
      const response = await this.client.get(`/api/irrigation/parcelle/${parcelleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching irrigation status:', error.message);
      throw new Error(`Failed to get irrigation status: ${error.message}`);
    }
  }

  async getCropCalendar(parcelleId, token) {
    try {
      const response = await this.client.get(`/api/calendar/parcelle/${parcelleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching crop calendar:', error.message);
      throw new Error(`Failed to get crop calendar: ${error.message}`);
    }
  }

  async detectDisease(imageBuffer, fileName, token) {
    try {
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('image', blob, fileName);

      const response = await this.client.post(`/api/v1/disease/detect`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error detecting disease:', error.message);
      throw new Error(`Failed to detect disease: ${error.message}`);
    }
  }
}

module.exports = new APIClient();
