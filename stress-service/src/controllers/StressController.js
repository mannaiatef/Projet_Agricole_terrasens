const logger = require('../utils/logger');
const StressAnalysisService = require('../services/StressAnalysisService');
const AlertService = require('../services/AlertService');
const MapService = require('../services/MapService');
const { addStressAnalysisJob, getJobStatus, getQueueStats } = require('../jobs/queue');

class StressController {
  /**
   * GET /stress/:parcelId or /stress/parcel/:id/latest
   * Get latest stress analysis for a parcel
   */
  getLatestAnalysis = async (req, res) => {
    try {
      // Handle both param names: parcelId (legacy) and id (new)
      const parcelId = req.params.parcelId || req.params.id;

      if (!parcelId) {
        return res.status(400).json({ 
          error: 'parcelId is required' 
        });
      }

      const analysis = await StressAnalysisService.getLatestAnalysis(parseInt(parcelId));

      if (!analysis) {
        return res.status(404).json({ 
          error: 'No stress analysis found for this parcel' 
        });
      }

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      logger.error('Get latest analysis failed', { message: error.message });
      res.status(500).json({ 
        error: 'Failed to retrieve analysis',
        message: error.message 
      });
    }
  };

  /**
   * POST /stress/analyze/:parcelId or /stress/analyze
   * Trigger a new stress analysis job
   */
  triggerAnalysis = async (req, res) => {
    try {
      // Handle both: parcelId from params (legacy) and parcel_id from body (new)
      const parcelId = req.params.parcelId || req.body.parcel_id;
      const { priority = 'normal' } = req.body;

      if (!parcelId) {
        return res.status(400).json({ 
          error: 'parcelId is required (in URL or body as parcel_id)' 
        });
      }

      const job = await addStressAnalysisJob(parseInt(parcelId), { 
        priority 
      });

      res.status(202).json({
        success: true,
        data: {
          job_id: job.id,
          parcel_id: parseInt(parcelId),
          status: 'queued'
        }
      });
    } catch (error) {
      logger.error('Trigger analysis failed', { message: error.message });
      res.status(500).json({ 
        error: 'Failed to queue analysis',
        message: error.message 
      });
    }
  };

  /**
   * GET /stress/job/:jobId
   * Get stress analysis job status
   */
  getJobStatus = async (req, res) => {
    try {
      const { jobId } = req.params;

      const status = await getJobStatus(jobId);

      if (!status) {
        return res.status(404).json({ 
          error: 'Job not found' 
        });
      }

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Get job status failed', { message: error.message });
      res.status(500).json({ 
        error: 'Failed to retrieve job status',
        message: error.message 
      });
    }
  };

  /**
   * GET /stress/history/:parcelId
   * Get analysis history for a parcel
   */
  getAnalysisHistory = async (req, res) => {
    try {
      const { parcelId } = req.params;
      const { limit = 50 } = req.query;

      if (!parcelId) {
        return res.status(400).json({ 
          error: 'parcelId is required' 
        });
      }

      const history = await StressAnalysisService.getParcelAnalysisHistory(
        parseInt(parcelId), 
        parseInt(limit)
      );

      res.json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error) {
      logger.error('Get analysis history failed', { message: error.message });
      res.status(500).json({ 
        error: 'Failed to retrieve analysis history',
        message: error.message 
      });
    }
  };

  /**
   * GET /stress/alerts/:parcelId or /stress/parcel/:id/alerts
   * Get active alerts for a parcel
   */
  getParcelAlerts = async (req, res) => {
    try {
      // Handle both param names: parcelId (legacy) and id (new)
      const parcelId = req.params.parcelId || req.params.id;

      if (!parcelId) {
        return res.status(400).json({ 
          error: 'parcelId is required' 
        });
      }

      const alerts = await AlertService.getParcelAlerts(parseInt(parcelId));
      const stats = await AlertService.getAlertStats(parseInt(parcelId));

      res.json({
        success: true,
        data: alerts,
        statistics: stats
      });
    } catch (error) {
      logger.error('Get alerts failed', { message: error.message });
      res.status(500).json({ 
        error: 'Failed to retrieve alerts',
        message: error.message 
      });
    }
  };

  /**
   * POST /stress/alerts/:alertId/acknowledge
   * Acknowledge an alert
   */
  acknowledgeAlert = async (req, res) => {
    try {
      const { alertId } = req.params;

      await AlertService.acknowledgeAlert(parseInt(alertId));

      res.json({
        success: true,
        message: 'Alert acknowledged'
      });
    } catch (error) {
      logger.error('Acknowledge alert failed', { message: error.message });
      res.status(500).json({ 
        error: 'Failed to acknowledge alert',
        message: error.message 
      });
    }
  };

  /**
   * GET /stress/queue/stats
   * Get queue statistics
   */
  getQueueStats = async (req, res) => {
    try {
      const stats = await getQueueStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get queue stats failed', { message: error.message });
      res.status(500).json({ 
        error: 'Failed to retrieve queue statistics',
        message: error.message 
      });
    }
  };

  /**
   * POST /stress/bulk-analyze
   * Queue analysis for multiple parcels
   */
  bulkAnalyze = async (req, res) => {
    try {
      const { parcelIds = [] } = req.body;

      if (!Array.isArray(parcelIds) || parcelIds.length === 0) {
        return res.status(400).json({ 
          error: 'parcelIds array is required' 
        });
      }

      const jobs = [];
      for (const parcelId of parcelIds) {
        try {
          const job = await addStressAnalysisJob(parcelId, { 
            priority: 'normal',
            delay: jobs.length * 2000 // Stagger by 2 seconds
          });
          jobs.push({ parcelId, jobId: job.id });
        } catch (error) {
          logger.error('Failed to queue parcel', { parcelId, message: error.message });
        }
      }

      res.status(202).json({
        success: true,
        message: `${jobs.length} analysis jobs queued`,
        jobs
      });
    } catch (error) {
      logger.error('Bulk analyze failed', { message: error.message });
      res.status(500).json({ 
        error: 'Failed to queue bulk analysis',
        message: error.message 
      });
    }
  };

  /**
   * GET /stress/parcel/:id/map
   * Get complete GIS map data for a parcel
   * Returns: polygon geometry, stress zones, center point, optional tile URLs
   */
  getParcelMapData = async (req, res) => {
    try {
      const parcelId = req.params.id;

      if (!parcelId) {
        return res.status(400).json({
          error: 'parcelId is required'
        });
      }

      const mapData = await MapService.getParcelMapData(parseInt(parcelId));

      res.json({
        success: true,
        data: mapData
      });
    } catch (error) {
      logger.error('Get parcel map data failed', { message: error.message });
      res.status(500).json({
        error: 'Failed to retrieve map data',
        message: error.message
      });
    }
  };

  /**
   * GET /stress/parcel/:id/map/history
   * Get historical map data for time slider/animation
   */
  getParcelMapHistory = async (req, res) => {
    try {
      const parcelId = req.params.id;
      const { limit = 10 } = req.query;

      if (!parcelId) {
        return res.status(400).json({
          error: 'parcelId is required'
        });
      }

      const history = await MapService.getParcelMapHistory(
        parseInt(parcelId),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error) {
      logger.error('Get parcel map history failed', { message: error.message });
      res.status(500).json({
        error: 'Failed to retrieve map history',
        message: error.message
      });
    }
  };
}

module.exports = new StressController();
