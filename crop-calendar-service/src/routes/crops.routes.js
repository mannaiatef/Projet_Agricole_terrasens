/**
 * CROPS ROUTES (Public)
 * 
 * These routes provide information about available crops
 * No authentication required for listing crops.
 */

const express = require('express');
const calendarController = require('../controllers/calendar.controller');

const router = express.Router();

/**
 * GET /crops
 * Get all supported crops
 */
router.get('/', (req, res) => calendarController.getCrops(req, res));

/**
 * GET /crops/:crop_name
 * Get crop details with all stages
 */
router.get('/:crop_name', (req, res) => calendarController.getCropDetails(req, res));

module.exports = router;
