const express = require('express');
const IrrigationController = require('../controllers/irrigation.controller');

const router = express.Router();

/**
 * IMPORTANT: Routes with specific paths must come BEFORE generic :parcelId routes
 */

/**
 * POST /irrigation/calculate/:parcelId
 * Calculate irrigation requirements
 */
router.post('/calculate/:parcelId', IrrigationController.calculateIrrigation);

/**
 * POST /irrigation/schedule
 * Create irrigation schedule
 */
router.post('/schedule', IrrigationController.scheduleIrrigation);

/**
 * POST /irrigation/schedule/:scheduleId/execute
 * Execute irrigation schedule
 */
router.post('/schedule/:scheduleId/execute', IrrigationController.executeSchedule);

/**
 * GET /irrigation/reports/history/:parcelId
 * Get detailed recommendation history
 */
router.get('/reports/history/:parcelId', IrrigationController.getRecommendationHistory);

/**
 * GET /irrigation/reports/date-range/:parcelId
 * Get recommendations by date range
 */
router.get('/reports/date-range/:parcelId', IrrigationController.getRecommendationsByDateRange);

/**
 * GET /irrigation/history/:parcelId
 * Get irrigation history
 */
router.get('/history/:parcelId', IrrigationController.getHistory);

/**
 * GET /irrigation/schedule/:parcelId
 * Get next scheduled irrigation
 */
router.get('/schedule/:parcelId', IrrigationController.getNextScheduled);

/**
 * GET /irrigation/:parcelId
 * Get latest irrigation recommendation (MUST BE LAST - matches any :parcelId)
 */
router.get('/:parcelId', IrrigationController.getLatestRecommendation);

module.exports = router;
