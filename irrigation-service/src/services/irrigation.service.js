const {
  getCropCoefficient,
  getStressAdjustmentFactor,
  getPriority,
  calculateDuration,
  getRecommendedTime,
  adjustForHumidity,
} = require('../utils/irrigation-calculator');
const {
  CropCalendarService,
  StressService,
  WeatherService,
} = require('./external.service');
const Logger = require('../utils/logger');
const {
  IrrigationRecordRepository,
  IrrigationScheduleRepository,
  IrrigationAlertRepository,
  IrrigationRecommendationRepository,
} = require('../repositories/irrigation.repository');

class IrrigationService {
  /**
   * Calculate irrigation requirements for a parcel
   * Returns detailed recommendation
   */
  static async calculateIrrigation(parcelId) {
    try {
      Logger.debug('IrrigationService.calculateIrrigation', { parcelId });

      // Fetch parcel data (required)
      let parcelle;
      try {
        parcelle = await CropCalendarService.getParcel(parcelId);
      } catch (error) {
        Logger.error('Failed to fetch parcel data', { parcelId, error: error.message });
        throw new Error(`Parcel ${parcelId} not found or service unavailable`);
      }

      // Fetch stress data (optional - can be null)
      const stressData = await StressService.getStressData(parcelId).catch(() => null);

      // Will fetch weather based on parcel location
      let weatherData_actual = null;

      // Extract parcel details
      const { name, latitude, longitude, polygon, surface, crop_id, crop_name } = parcelle;
      const areaHectares = surface || 1;

      // Fetch weather data based on parcel location
      weatherData_actual = await WeatherService.getWeather(latitude, longitude).catch(
        () => null
      );

      // Calculate ETc (Crop water requirement)
      const et0 = weatherData_actual?.current?.et0 || 5.0; // Default ET0 value
      const kc = getCropCoefficient(crop_name);
      const etc = et0 * kc;

      // Calculate base water amount (mm)
      const baseWaterAmount = etc;

      // Apply stress adjustment
      const stressScore = stressData ? StressService.calculateStressScore(stressData) : 0;
      const ndvi = stressData?.record?.mean_ndvi || 0.6;
      const stressPercentage = stressData?.record?.stress_percentage || 0;
      const stressAdjustment = getStressAdjustmentFactor(ndvi, stressPercentage);
      const adjustedWaterAmount = baseWaterAmount * stressAdjustment;

      // Apply humidity adjustment
      const humidity = weatherData_actual?.current?.humidity || 60;
      const finalWaterAmount = adjustForHumidity(adjustedWaterAmount, humidity);

      // Get forecast rain
      const rainForecast = WeatherService.getRainfallForecast(weatherData_actual, 24);

      // Determine priority
      const priority = getPriority(stressPercentage, rainForecast);

      // Calculate duration
      const duration = calculateDuration(finalWaterAmount, areaHectares);

      // Get recommended time
      const recommendedTime = getRecommendedTime(weatherData_actual?.current);

      // Build response
      const recommendation = {
        parcel_id: parcelId,
        parcel_name: name,
        crop_name: crop_name,
        area_hectares: areaHectares,
        water_amount_mm: Math.round(finalWaterAmount * 100) / 100,
        water_volume_m3: Math.round((finalWaterAmount * areaHectares * 10) * 100) / 100, // mm * hectares = m3/10
        duration_minutes: duration,
        priority,
        recommended_time: recommendedTime,
        calculations: {
          et0: Math.round(et0 * 100) / 100,
          kc,
          etc: Math.round(etc * 100) / 100,
          base_water_amount: Math.round(baseWaterAmount * 100) / 100,
          stress_adjustment: Math.round(stressAdjustment * 100) / 100,
          humidity_adjustment: Math.round((finalWaterAmount / adjustedWaterAmount) * 100) / 100,
        },
        conditions: {
          stress_percentage: stressPercentage,
          stress_score: stressScore,
          ndvi: Math.round(ndvi * 1000) / 1000,
          temperature: weatherData_actual?.current?.temperature || 0,
          humidity: humidity,
          rain_forecast_24h: Math.round(rainForecast * 100) / 100,
          weather_description: WeatherService.interpretWeatherCode(
            weatherData_actual?.current?.weatherCode
          ),
        },
        location: {
          latitude,
          longitude,
          polygon,
        },
        decision_reason: this._buildDecisionReason(
          stressPercentage,
          rainForecast,
          humidity,
          ndvi
        ),
      };

      Logger.info('IrrigationService.calculateIrrigation completed', {
        parcelId,
        priority,
        waterAmount: recommendation.water_amount_mm,
      });

      // Save recommendation to database
      try {
        await this.saveDetailedRecommendation(recommendation);
      } catch (error) {
        Logger.error('Failed to save recommendation to database', { parcelId, error: error.message });
        // Don't throw - still return the recommendation even if saving fails
      }

      return recommendation;
    } catch (error) {
      Logger.error('IrrigationService.calculateIrrigation failed', {
        parcelId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Save detailed recommendation to database
   */
  static async saveDetailedRecommendation(recommendation) {
    const repository = new IrrigationRecommendationRepository();
    return repository.saveRecommendation(recommendation);
  }

  /**
   * Get recommendation report by ID
   */
  static async getRecommendationById(recommendationId) {
    const repository = new IrrigationRecommendationRepository();
    return repository.getLatest(recommendationId);
  }

  /**
   * Get recommendation history for a parcel (detailed reports)
   */
  static async getRecommendationHistory(parcelId, limit = 50) {
    const repository = new IrrigationRecommendationRepository();
    return repository.getHistory(parcelId, limit);
  }

  /**
   * Get recommendations by date range
   */
  static async getRecommendationsByDateRange(parcelId, startDate, endDate) {
    const repository = new IrrigationRecommendationRepository();
    return repository.getByDateRange(parcelId, startDate, endDate);
  }

  /**
   * Save irrigation recommendation to database (legacy)
   */
  static async saveRecommendation(recommendation) {
    const repository = new IrrigationRecordRepository();

    const record = {
      parcel_id: recommendation.parcel_id,
      water_amount: recommendation.water_amount_mm,
      duration: recommendation.duration_minutes,
      priority: recommendation.priority,
      recommended_time: new Date(`${new Date().toISOString().split('T')[0]}T${recommendation.recommended_time}`),
      status: 'PENDING',
      weather_data: recommendation.conditions,
      crop_data: {
        crop_name: recommendation.crop_name,
        area_hectares: recommendation.area_hectares,
      },
    };

    return repository.create(record);
  }

  /**
   * Get latest irrigation recommendation for a parcel
   */
  static async getLatestRecommendation(parcelId) {
    const repository = new IrrigationRecordRepository();
    return repository.getLatest(parcelId);
  }

  /**
   * Get irrigation history
   */
  static async getHistory(parcelId, limit = 30) {
    const repository = new IrrigationRecordRepository();
    return repository.getHistory(parcelId, limit);
  }

  /**
   * Create irrigation schedule
   */
  static async scheduleIrrigation(parcelId, scheduledTime, waterAmount, duration, reason = null) {
    const scheduleRepository = new IrrigationScheduleRepository();

    const schedule = {
      parcel_id: parcelId,
      scheduled_time: scheduledTime,
      water_amount: waterAmount,
      duration,
      reason,
    };

    return scheduleRepository.create(schedule);
  }

  /**
   * Get next scheduled irrigation
   */
  static async getNextScheduled(parcelId) {
    const repository = new IrrigationScheduleRepository();
    return repository.getNext(parcelId);
  }

  /**
   * Check for high stress and create alert
   */
  static async checkAndCreateAlerts(parcelId, stressData, weatherData) {
    const alertRepository = new IrrigationAlertRepository();
    const alerts = [];

    // High stress alert
    if (stressData?.stress_percentage > 50) {
      const alert = await alertRepository.create({
        parcel_id: parcelId,
        alert_type: 'HIGH_STRESS',
        message: `High water stress detected: ${stressData.stress_percentage}%`,
        severity: 'CRITICAL',
      });
      alerts.push(alert);
    }

    // Low NDVI alert
    if (stressData?.mean_ndvi < 0.3) {
      const alert = await alertRepository.create({
        parcel_id: parcelId,
        alert_type: 'LOW_NDVI',
        message: `Low vegetation health (NDVI: ${stressData.mean_ndvi})`,
        severity: 'WARNING',
      });
      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Build human-readable decision reason
   */
  static _buildDecisionReason(stressPercentage, rainForecast, humidity, ndvi) {
    const reasons = [];

    if (rainForecast > 10) {
      reasons.push(`Significant rainfall forecast (${rainForecast.toFixed(1)}mm)`);
    }

    if (stressPercentage > 50) {
      reasons.push(`High water stress (${stressPercentage}%)`);
    } else if (stressPercentage > 30) {
      reasons.push(`Moderate water stress (${stressPercentage}%)`);
    }

    if (humidity > 80) {
      reasons.push(`High humidity (${humidity}%) - reduced irrigation`);
    } else if (humidity < 40) {
      reasons.push(`Low humidity (${humidity}%) - increased irrigation`);
    }

    if (ndvi < 0.4) {
      reasons.push('Poor vegetation health - increased irrigation');
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Normal irrigation requirements';
  }
}

module.exports = IrrigationService;
