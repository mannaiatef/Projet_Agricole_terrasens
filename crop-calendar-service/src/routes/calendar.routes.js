/**
 * CALENDAR ROUTES (Protected)
 * 
 * All routes require JWT authentication.
 * Base path depends on API Gateway routing.
 */

const express = require('express');
const calendarController = require('../controllers/calendar.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * GET /crop-calendar/crops
 * Get list of supported crops (public)
 */
router.get('/crops', (req, res) => calendarController.getCrops(req, res));

/**
 * GET /crop-calendar/parcelle/:parcelle_id
 * Get all calendars for a parcelle (MUST come before /:farm_id routes)
 */
router.get('/parcelle/:parcelle_id', authMiddleware, (req, res) =>
  calendarController.getCalendarsByParcelleId(req, res)
);

/**
 * GET /crop-calendar/:farm_id
 * Get full calendar for a farm (protected)
 */
router.get('/:farm_id', authMiddleware, (req, res) =>
  calendarController.getCalendar(req, res)
);

/**
 * GET /crop-calendar/:farm_id/current
 * Get current stage of a calendar (protected)
 */
router.get('/:farm_id/current', authMiddleware, (req, res) =>
  calendarController.getCurrentStage(req, res)
);

/**
 * POST /crop-calendar/:farm_id/regenerate
 * Regenerate calendar (protected)
 */
router.post('/:farm_id/regenerate', authMiddleware, (req, res) =>
  calendarController.regenerateCalendar(req, res)
);

/**
 * POST /crop-calendar/:farm_id
 * Generate new calendar (protected)
 */
router.post('/:farm_id', authMiddleware, (req, res) =>
  calendarController.generateCalendar(req, res)
);

/**
 * GET /crops/:crop_name
 * Get crop details
 */
router.get('/crops/:crop_name', (req, res) =>
  calendarController.getCropDetails(req, res)
);

module.exports = router;

