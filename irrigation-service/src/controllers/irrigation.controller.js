const IrrigationService = require('../services/irrigation.service');
const { IrrigationRecordRepository, IrrigationScheduleRepository } = require('../repositories/irrigation.repository');
const Logger = require('../utils/logger');

class IrrigationController {
  /**
   * GET /irrigation/:parcelId
   * Get latest irrigation recommendation for a parcel - calculates if not cached
   */
  static getLatestRecommendation = async (req, res) => {
    try {
      const { parcelId } = req.params;

      // First try to get cached recommendation
      let recommendation = await IrrigationService.getLatestRecommendation(parcelId);

      // If no cached recommendation, calculate a new one
      if (!recommendation) {
        recommendation = await IrrigationService.calculateIrrigation(parcelId);
      }

      if (!recommendation) {
        return res.status(404).json({
          success: false,
          message: 'No irrigation recommendation found for this parcel',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Latest irrigation recommendation',
        data: recommendation,
      });
    } catch (error) {
      Logger.error('IrrigationController.getLatestRecommendation', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error retrieving recommendation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * POST /irrigation/calculate/:parcelId
   * Calculate irrigation requirements for a parcel
   */
  static calculateIrrigation = async (req, res) => {
    try {
      const { parcelId } = req.params;

      Logger.info('IrrigationController.calculateIrrigation', { parcelId });

      // calculateIrrigation automatically saves detailed recommendation to database
      const recommendation = await IrrigationService.calculateIrrigation(parcelId);

      res.status(201).json({
        success: true,
        message: 'Irrigation calculation completed',
        data: recommendation,
      });
    } catch (error) {
      Logger.error('IrrigationController.calculateIrrigation', { error: error.message });

      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * POST /irrigation/schedule
   * Create irrigation schedule
   */
  static scheduleIrrigation = async (req, res) => {
    try {
      const { parcel_id, scheduled_time, water_amount, duration, reason } = req.body;

      // Validation
      if (!parcel_id || !scheduled_time || !water_amount || !duration) {
        return res.status(400).json({
          success: false,
          message: 'parcel_id, scheduled_time, water_amount, and duration are required',
        });
      }

      const schedule = await IrrigationService.scheduleIrrigation(
        parcel_id,
        scheduled_time,
        water_amount,
        duration,
        reason
      );

      Logger.info('IrrigationSchedule created', { parcel_id, scheduled_time });

      res.status(201).json({
        success: true,
        message: 'Irrigation scheduled successfully',
        data: schedule,
      });
    } catch (error) {
      Logger.error('IrrigationController.scheduleIrrigation', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error creating schedule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * GET /irrigation/history/:parcelId
   * Get irrigation history for a parcel
   */
  static getHistory = async (req, res) => {
    try {
      const { parcelId } = req.params;
      const { limit = 30 } = req.query;

      const history = await IrrigationService.getHistory(parcelId, parseInt(limit));

      res.status(200).json({
        success: true,
        message: 'Irrigation history retrieved',
        data: history,
        count: history.length,
      });
    } catch (error) {
      Logger.error('IrrigationController.getHistory', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error retrieving history',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * GET /irrigation/schedule/:parcelId
   * Get next scheduled irrigation
   */
  static getNextScheduled = async (req, res) => {
    try {
      const { parcelId } = req.params;

      const schedule = await IrrigationService.getNextScheduled(parcelId);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'No scheduled irrigation found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Next scheduled irrigation',
        data: schedule,
      });
    } catch (error) {
      Logger.error('IrrigationController.getNextScheduled', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error retrieving schedule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * POST /irrigation/schedule/:scheduleId/execute
   * Execute irrigation schedule
   */
  static executeSchedule = async (req, res) => {
    try {
      const { scheduleId } = req.params;

      const scheduleRepository = new IrrigationScheduleRepository();
      await scheduleRepository.updateStatus(scheduleId, 'EXECUTED', new Date());

      Logger.info('IrrigationSchedule executed', { scheduleId });

      res.status(200).json({
        success: true,
        message: 'Irrigation schedule executed',
      });
    } catch (error) {
      Logger.error('IrrigationController.executeSchedule', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error executing schedule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * GET /irrigation/reports/history/:parcelId
   * Get detailed recommendation history for a parcel
   */
  static getRecommendationHistory = async (req, res) => {
    try {
      const { parcelId } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      const history = await IrrigationService.getRecommendationHistory(parcelId, limit);

      res.status(200).json({
        success: true,
        message: 'Recommendation history',
        data: history,
        count: history.length,
      });
    } catch (error) {
      Logger.error('IrrigationController.getRecommendationHistory', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error retrieving recommendation history',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * GET /irrigation/reports/date-range/:parcelId
   * Get recommendations by date range
   */
  static getRecommendationsByDateRange = async (req, res) => {
    try {
      const { parcelId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate query parameters are required',
        });
      }

      const recommendations = await IrrigationService.getRecommendationsByDateRange(
        parcelId,
        startDate,
        endDate
      );

      res.status(200).json({
        success: true,
        message: 'Recommendations by date range',
        data: recommendations,
        count: recommendations.length,
      });
    } catch (error) {
      Logger.error('IrrigationController.getRecommendationsByDateRange', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error retrieving recommendations',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };
}

module.exports = IrrigationController;
