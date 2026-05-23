const DiseaseAnalysisService = require('../services/DiseaseAnalysisService');

/**
 * DiseaseAnalysisController
 * Handles HTTP requests for disease analysis operations
 */
class DiseaseAnalysisController {
  constructor() {
    this.service = new DiseaseAnalysisService();
  }

  /**
   * POST /api/v1/disease/analyze
   * Upload image and perform disease analysis
   */
  analyzeImage = async (req, res) => {
    try {
      // Validate file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_IMAGE',
            message: 'Image file is required'
          }
        });
      }

      // Get user ID from auth middleware
      const userId = parseInt(req.userId);
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_USER',
            message: 'Valid user ID required'
          }
        });
      }

      // Extract options from request
      const options = {
        parcelId: req.body.parcelId ? parseInt(req.body.parcelId) : null,
        cropType: req.body.cropType || null
      };

      // Perform analysis
      const result = await this.service.analyzeImage(userId, req.file, options);

      // Return success response
      res.status(200).json(result);
    } catch (error) {
      this._handleError(res, error);
    }
  };

  /**
   * GET /api/v1/disease/history
   * Get analysis history for authenticated user
   */
  getHistory = async (req, res) => {
    try {
      const userId = parseInt(req.userId);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const offset = parseInt(req.query.offset) || 0;

      const result = await this.service.getAnalysisHistory(userId, limit, offset);

      res.status(200).json(result);
    } catch (error) {
      this._handleError(res, error);
    }
  };

  /**
   * GET /api/v1/disease/analysis/:analysisId
   * Get details of a specific analysis
   */
  getAnalysis = async (req, res) => {
    try {
      const { analysisId } = req.params;

      if (!analysisId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_ANALYSIS_ID',
            message: 'Analysis ID is required'
          }
        });
      }

      const result = await this.service.getAnalysis(analysisId);

      res.status(200).json(result);
    } catch (error) {
      this._handleError(res, error);
    }
  };

  /**
   * GET /api/v1/disease/parcel/:parcelId
   * Get all analyses for a specific parcel
   */
  getParcelAnalyses = async (req, res) => {
    try {
      const { parcelId } = req.params;
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const offset = parseInt(req.query.offset) || 0;

      if (!parcelId || isNaN(parcelId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARCEL_ID',
            message: 'Valid parcel ID is required'
          }
        });
      }

      const result = await this.service.getParcelAnalyses(
        parseInt(parcelId),
        limit,
        offset
      );

      res.status(200).json(result);
    } catch (error) {
      this._handleError(res, error);
    }
  };

  /**
   * GET /api/v1/disease/statistics
   * Get disease statistics for authenticated user
   */
  getStatistics = async (req, res) => {
    try {
      const userId = parseInt(req.userId);

      const result = await this.service.getDiseaseStatistics(userId);

      res.status(200).json(result);
    } catch (error) {
      this._handleError(res, error);
    }
  };

  /**
   * GET /api/v1/disease/high-risk
   * Get high-confidence disease detections
   */
  getHighRiskAnalyses = async (req, res) => {
    try {
      const userId = parseInt(req.userId);
      const minConfidence = parseInt(req.query.confidence) || 80;

      if (minConfidence < 0 || minConfidence > 100) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CONFIDENCE',
            message: 'Confidence must be between 0 and 100'
          }
        });
      }

      const result = await this.service.getHighConfidenceAnalyses(userId, minConfidence);

      res.status(200).json(result);
    } catch (error) {
      this._handleError(res, error);
    }
  };

  /**
   * DELETE /api/v1/disease/analysis/:analysisId
   * Delete an analysis and associated image
   */
  deleteAnalysis = async (req, res) => {
    try {
      const { analysisId } = req.params;
      const userId = parseInt(req.userId);

      if (!analysisId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_ANALYSIS_ID',
            message: 'Analysis ID is required'
          }
        });
      }

      const result = await this.service.deleteAnalysis(analysisId, userId);

      res.status(200).json(result);
    } catch (error) {
      this._handleError(res, error);
    }
  };

  /**
   * Health check endpoint
   */
  health = (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'disease-detection-service',
      timestamp: new Date().toISOString()
    });
  };

  /**
   * Error handling helper
   * @private
   */
  _handleError = (res, error) => {
    console.error('Controller Error:', error.message);

    // Determine status code
    let statusCode = error.statusCode || 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = error.message;

    // Handle specific error types
    if (error.message.includes('validation')) {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
    } else if (error.message.includes('not found')) {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
    } else if (error.message.includes('Unauthorized')) {
      statusCode = 403;
      errorCode = 'UNAUTHORIZED';
    } else if (error.message.includes('API')) {
      statusCode = 503;
      errorCode = 'SERVICE_UNAVAILABLE';
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: message,
        timestamp: new Date().toISOString()
      }
    });
  };
}

module.exports = new DiseaseAnalysisController();
