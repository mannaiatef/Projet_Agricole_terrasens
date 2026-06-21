const express = require('express');
const StressController = require('../controllers/StressController');
const SentinelHubController = require('../controllers/SentinelHubController');

const router = express.Router();

// NEW REST-style routes (more specific routes first)

/**
 * GET /stress/parcel/:id/latest
 * Get latest stress analysis for a parcel
 */
router.get('/parcel/:id/latest', StressController.getLatestAnalysis);

/**
 * GET /stress/parcel/:id/map
 * Get complete GIS map data for a parcel
 */
router.get('/parcel/:id/map', StressController.getParcelMapData);

/**
 * GET /stress/parcel/:id/map/history
 * Get historical map data for time slider
 */
router.get('/parcel/:id/map/history', StressController.getParcelMapHistory);

/**
 * GET /stress/parcel/:id/alerts
 * Get alerts for parcel
 */
router.get('/parcel/:id/alerts', StressController.getParcelAlerts);

/**
 * POST /stress/analyze
 * Trigger new analysis job with parcel_id in body
 */
router.post('/analyze', StressController.triggerAnalysis);

/**
 * GET /stress/jobs/:jobId
 * Get job status
 */
router.get('/jobs/:jobId', StressController.getJobStatus);

/**
 * GET /stress/queue/stats
 * Get queue statistics
 */
router.get('/queue/stats', StressController.getQueueStats);

// ============================================
// SENTINEL HUB ROUTES
// ============================================

/**
 * GET /stress/sentinel/image/:fieldId
 * Retrieve satellite image from Sentinel Hub for a field
 * Query params: imageType (NDVI|TrueColor|Moisture), date
 */
router.get('/sentinel/image/:fieldId', SentinelHubController.getFieldImage);

/**
 * GET /stress/sentinel/image/:fieldId/metadata
 * Get metadata about available satellite images
 */
router.get('/sentinel/image/:fieldId/metadata', SentinelHubController.getFieldImageMetadata);

/**
 * GET /stress/sentinel/field/:fieldId/info
 * Get comprehensive field information for sentinel image viewer
 */
router.get('/sentinel/field/:fieldId/info', SentinelHubController.getFieldInfo);

/**
 * GET /stress/sentinel/legend
 * Get NDVI color scale legend
 */
router.get('/sentinel/legend', SentinelHubController.getNDVILegend);

/**
 * POST /stress/sentinel/download/:fieldId
 * Download satellite image with metadata
 */
router.post('/sentinel/download/:fieldId', SentinelHubController.downloadFieldImage);

// LEGACY routes (kept for backward compatibility)

/**
 * GET /stress/:parcelId
 * Get latest stress analysis for a parcel (legacy)
 */
router.get('/:parcelId', StressController.getLatestAnalysis);

/**
 * POST /stress/analyze/:parcelId
 * Trigger new analysis job (legacy)
 */
router.post('/analyze/:parcelId', StressController.triggerAnalysis);

/**
 * GET /stress/job/:jobId
 * Get job status (legacy)
 */
router.get('/job/:jobId', StressController.getJobStatus);

/**
 * GET /stress/history/:parcelId
 * Get analysis history
 */
router.get('/history/:parcelId', StressController.getAnalysisHistory);

/**
 * GET /stress/alerts/:parcelId
 * Get alerts for parcel
 */
router.get('/alerts/:parcelId', StressController.getParcelAlerts);

/**
 * POST /stress/alerts/:alertId/acknowledge
 * Acknowledge alert
 */
router.post('/alerts/:alertId/acknowledge', StressController.acknowledgeAlert);

/**
 * GET /stress/queue/stats
 * Get queue statistics
 */
router.get('/queue/stats', StressController.getQueueStats);

/**
 * POST /stress/bulk-analyze
 * Queue multiple parcels for analysis
 */
router.post('/bulk-analyze', StressController.bulkAnalyze);

module.exports = router;
