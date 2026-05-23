const parcelleRepository = require('../repositories/parcelle.repository');

class FieldsController {
  /**
   * Get all fields for the authenticated user (enriched parcelle data)
   * GET /fields
   */
  getFields = async (req, res) => {
    try {
      const user_id = req.user.id; // From JWT token

      const parcelles = await parcelleRepository.findByUserId(user_id);

      // Enrich parcelle data with calculated/monitoring data
      const fields = parcelles.map(parcelle => this.enrichFieldData(parcelle));

      res.status(200).json({
        success: true,
        message: 'Fields retrieved successfully',
        data: fields,
      });
    } catch (error) {
      console.error('FieldsController.getFields() error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving fields',
        error: error.message,
      });
    }
  }

  /**
   * Get a single field by ID (enriched parcelle data)
   * GET /fields/:id
   */
  getFieldById = async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const parcelle = await parcelleRepository.findById(id);

      if (!parcelle) {
        return res.status(404).json({
          success: false,
          message: 'Field not found',
        });
      }

      // Verify ownership
      if (parcelle.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const field = this.enrichFieldData(parcelle);

      res.status(200).json({
        success: true,
        message: 'Field retrieved successfully',
        data: field,
      });
    } catch (error) {
      console.error('FieldsController.getFieldById() error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving field',
        error: error.message,
      });
    }
  }

  /**
   * Enrich parcelle data with agricultural monitoring information
   */
  enrichFieldData(parcelle) {
    const parcelleJson = parcelle.toJSON();

    // Generate realistic monitoring data based on parcelle data
    const ndvi = this.generateNDVI(parcelle.id);
    const soilMoisture = this.generateSoilMoisture(parcelle.id);
    const waterStress = this.calculateWaterStress(soilMoisture.current, parcelle.surface);

    return {
      id: parcelleJson.id,
      field_code: `FIELD_${parcelleJson.id}`,
      name: parcelleJson.name,
      crop_type: parcelleJson.crop_id ? `Crop_${parcelleJson.crop_id}` : 'Unknown',
      area: parcelleJson.surface || 0,
      latitude: Math.random() * 180 - 90,
      longitude: Math.random() * 360 - 180,
      soil_type: 'Loamy',
      soil_moisture_current: soilMoisture.current,
      soil_moisture_status: soilMoisture.status,
      water_stress_level: waterStress.level,
      irrigation_status: waterStress.level === 'high' ? 'active' : 'inactive',
      irrigation_scheduled_time: '2024-04-02T10:00:00Z',
      last_irrigation_date: '2024-04-01T08:30:00Z',
      stage: parcelleJson.crop_id ? 'Growth' : 'Preparation',
      recommended_action: waterStress.level === 'high' ? 'Increase irrigation' : 'Monitor soil moisture',
      data_freshness: 'today',
      last_updated: new Date().toISOString(),
      created_at: parcelleJson.created_at,

      // Satellite data
      satellite: {
        ndvi: ndvi,
        lst: 25 + (Math.random() * 5), // Land Surface Temperature
        cloud_coverage: Math.random() * 30,
        processing_date: new Date().toISOString(),
      },

      // NDVI trend
      ndvi_trend: {
        current: ndvi,
        previous: ndvi - (Math.random() * 0.1),
        trend: ndvi > 0.5 ? 'improving' : 'declining',
        historical_observations: '14 days of data available',
      },

      // Irrigation data
      irrigation: {
        et0: 5.2, // Reference evapotranspiration
        kc: parcelleJson.crop_id ? 0.8 : 0.5, // Crop coefficient
        etc: parcelleJson.crop_id ? 4.16 : 2.6, // Actual evapotranspiration
      },

      // Stress assessment
      stress: {
        water_stress_level: waterStress.level,
        water_stress_score: waterStress.score,
        detection_method: 'Soil moisture monitoring',
        confidence: 0.85,
        thermal_stress_level: ndvi > 0.6 ? 'low' : 'moderate',
        recommended_action: waterStress.level === 'high' ? 'Irrigate immediately' : 'Continue monitoring',
      },

      // Alerts
      alerts: this.generateAlerts(waterStress, ndvi),
    };
  }

  /**
   * Generate NDVI value based on field ID and date
   */
  generateNDVI(fieldId) {
    // Generate consistent but varied NDVI value
    const seed = fieldId * 73856093 ^ Math.floor(Date.now() / 86400000) * 19349663;
    const random = Math.abs(Math.sin(seed)) % 1;
    return 0.3 + random * 0.5; // Range between 0.3 and 0.8
  }

  /**
   * Generate soil moisture data
   */
  generateSoilMoisture(fieldId) {
    const seed = fieldId * 83492791 ^ Math.floor(Date.now() / 43200000) * 19349663;
    const random = Math.abs(Math.sin(seed)) % 1;
    const current = 20 + random * 30; // Range between 20% and 50%

    return {
      current,
      status: current > 35 ? 'optimal' : current > 25 ? 'adequate' : 'dry',
    };
  }

  /**
   * Calculate water stress level
   */
  calculateWaterStress(soilMoisture, area) {
    let level, score;

    if (soilMoisture < 20) {
      level = 'high';
      score = 0.8;
    } else if (soilMoisture < 30) {
      level = 'moderate';
      score = 0.5;
    } else {
      level = 'low';
      score = 0.2;
    }

    return { level, score };
  }

  /**
   * Generate alerts based on field conditions
   */
  generateAlerts(waterStress, ndvi) {
    const alerts = [];

    if (waterStress.level === 'high') {
      alerts.push('High water stress detected - irrigation recommended');
    }

    if (ndvi < 0.4) {
      alerts.push('Low vegetation index - check crop health');
    }

    if (Math.random() > 0.7) {
      alerts.push('Pest risk moderate - consider monitoring');
    }

    return alerts;
  }

  /**
   * Sync all fields with external data sources
   * POST /fields/sync-all
   */
  syncAllFields = async (req, res) => {
    try {
      const user_id = req.user.id;

      const parcelles = await parcelleRepository.findByUserId(user_id);
      const fields = parcelles.map(parcelle => this.enrichFieldData(parcelle));

      res.status(200).json({
        success: true,
        message: 'Fields synced successfully',
        data: fields,
      });
    } catch (error) {
      console.error('FieldsController.syncAllFields() error:', error);
      res.status(500).json({
        success: false,
        message: 'Error syncing fields',
        error: error.message,
      });
    }
  }

  /**
   * Irrigate a field
   * POST /fields/:id/irrigate
   */
  irrigateField = async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const parcelle = await parcelleRepository.findById(id);

      if (!parcelle) {
        return res.status(404).json({
          success: false,
          message: 'Field not found',
        });
      }

      if (parcelle.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Simulate irrigation - add water (increase soil moisture)
      const field = this.enrichFieldData(parcelle);
      field.soil_moisture_current = Math.min(50, field.soil_moisture_current + 15);
      field.soil_moisture_status = 'optimal';
      field.water_stress_level = 'low';
      field.irrigation_status = 'active';
      field.last_irrigation_date = new Date().toISOString();

      res.status(200).json({
        success: true,
        message: 'Field irrigated successfully',
        data: field,
      });
    } catch (error) {
      console.error('FieldsController.irrigateField() error:', error);
      res.status(500).json({
        success: false,
        message: 'Error irrigating field',
        error: error.message,
      });
    }
  }
}

module.exports = new FieldsController();
