const HttpClient = require('../utils/http-client');
const Logger = require('../utils/logger');

class CropCalendarService {
  static async getParcel(parcelId) {
    try {
      const url = `${process.env.CROP_CALENDAR_SERVICE_URL}/parcelles/internal/${parcelId}`;
      const response = await HttpClient.get(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch parcel');
      }

      return response.data;
    } catch (error) {
      Logger.error(`CropCalendarService.getParcel failed`, { parcelId, error: error.message });
      throw error;
    }
  }

  static async getAllParcels() {
    try {
      const url = `${process.env.CROP_CALENDAR_SERVICE_URL}/parcelles/internal`;
      const response = await HttpClient.get(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch parcels');
      }

      return response.data || [];
    } catch (error) {
      Logger.error('CropCalendarService.getAllParcels failed', { error: error.message });
      throw error;
    }
  }
}

class StressService {
  static async getStressData(parcelId) {
    try {
      const url = `${process.env.STRESS_SERVICE_URL}/stress/${parcelId}`;
      const response = await HttpClient.get(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch stress data');
      }

      return response.data;
    } catch (error) {
      Logger.error('StressService.getStressData failed', { parcelId, error: error.message });
      throw error;
    }
  }

  /**
   * Calculate composite stress score
   * Combines NDVI and stress percentage into single metric
   */
  static calculateStressScore(stressData) {
    if (!stressData) return 0;

    // Handle nested structure from stress service: { record, zones, alerts, summary }
    const actualData = stressData.record || stressData;
    
    const stressPercentage = actualData.stress_percentage || 0;
    const ndvi = actualData.mean_ndvi || 0;

    // Stress score: 0-100 (higher = more stressed)
    // Weight: 70% stress_percentage, 30% inverted NDVI
    const ndviInverted = (1 - ndvi) * 100;
    return Math.round(stressPercentage * 0.7 + ndviInverted * 0.3);
  }
}

class WeatherService {
  /**
   * Fetch weather data from Open-Meteo API
   * Free alternative, no key required
   */
  static async getWeather(latitude, longitude) {
    try {
      const url = `${process.env.WEATHER_API_URL}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,evapotranspiration,precipitation,weather_code&hourly=precipitation&forecast_days=3`;

      const response = await HttpClient.get(url);

      return {
        current: {
          temperature: response.current?.temperature_2m || 0,
          humidity: response.current?.relative_humidity_2m || 0,
          et0: response.current?.evapotranspiration || 0,
          precipitation: response.current?.precipitation || 0,
          weatherCode: response.current?.weather_code || 0,
        },
        hourly: response.hourly,
        timezone: response.timezone,
      };
    } catch (error) {
      Logger.error('WeatherService.getWeather failed', {
        latitude,
        longitude,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get rainfall forecast for next 24-48 hours
   */
  static getRainfallForecast(weatherData, hours = 24) {
    try {
      if (!weatherData?.hourly?.precipitation) {
        return 0;
      }

      const hourCount = Math.min(hours, weatherData.hourly.precipitation.length);
      const forecastPrecipitation = weatherData.hourly.precipitation.slice(0, hourCount);

      return forecastPrecipitation.reduce((sum, val) => sum + (val || 0), 0);
    } catch (error) {
      Logger.error('WeatherService.getRainfallForecast failed', { error: error.message });
      return 0;
    }
  }

  /**
   * Interpret weather code
   */
  static interpretWeatherCode(code) {
    const codes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Foggy rime',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    };

    return codes[code] || 'Unknown';
  }
}

module.exports = {
  CropCalendarService,
  StressService,
  WeatherService,
};
