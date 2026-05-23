/**
 * CALENDAR CONTROLLER
 * 
 * Handles HTTP requests for crop calendar operations.
 */

const calendarService = require('../services/calendar.service');
const { verifyJWT } = require('../middlewares/auth.middleware');

class CalendarController {
  /**
   * GET /crops
   * Return list of supported crops
   */
  getCrops = async (req, res) => {
    try {
      const crops = calendarService.getAvailableCrops();

      res.status(200).json({
        success: true,
        data: crops,
      });
    } catch (error) {
      console.error('Error fetching crops:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /crop-calendar/:farm_id or /calendar/:id
   * Get calendar for a farm or parcelle
   * Tries to find calendar by parcelle_id first (since frontend uses parcelle IDs)
   */
  getCalendar = async (req, res) => {
    try {
      const { farm_id } = req.params;
      const user_id = req.user.id; // From auth middleware

      if (!farm_id) {
        return res.status(400).json({
          success: false,
          message: 'farm_id is required',
        });
      }

      const id = parseInt(farm_id);
      
      // Try to get calendar by parcelle_id first (frontend passes parcelle IDs)
      const calendars = await calendarService.getCalendarsByParcelleId(id);
      
      if (calendars && calendars.length > 0) {
        // Return the most recent calendar for this parcelle
        const calendar = calendars[calendars.length - 1];
        return res.status(200).json({
          success: true,
          data: calendar,
        });
      }

      // Fall back to farm_id lookup (legacy compatibility)
      const calendar = await calendarService.getCalendarByFarmId(id, user_id);

      if (calendar) {
        return res.status(200).json({
          success: true,
          data: calendar,
        });
      }

      // No calendar exists yet - return 200 with null data instead of error
      // Frontend will handle null gracefully (normal for newly created parcelles without assigned crops)
      res.status(200).json({
        success: true,
        message: 'No calendar exists for this parcelle yet',
        data: null,
      });
    } catch (error) {
      console.error('Error fetching calendar:', error);
      const status = error.status || 400;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /crop-calendar/:farm_id/current
   * Return current stage of a calendar
   */
  getCurrentStage = async (req, res) => {
    try {
      const { farm_id } = req.params;
      const user_id = req.user.id; // From auth middleware

      if (!farm_id) {
        return res.status(400).json({
          success: false,
          message: 'farm_id is required',
        });
      }

      const currentStage = await calendarService.getCurrentStage(
        parseInt(farm_id),
        user_id
      );

      res.status(200).json({
        success: true,
        data: currentStage,
      });
    } catch (error) {
      console.error('Error fetching current stage:', error);
      const status = error.status || 400;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /crop-calendar/:farm_id/regenerate
   * Delete old calendar, generate new one
   */
  regenerateCalendar = async (req, res) => {
    try {
      const { farm_id } = req.params;
      const { crop_name, sowing_date } = req.body;
      const user_id = req.user.id; // From auth middleware

      // Validate required fields
      if (!farm_id) {
        return res.status(400).json({
          success: false,
          message: 'farm_id is required',
        });
      }

      if (!crop_name || !sowing_date) {
        return res.status(400).json({
          success: false,
          message: 'crop_name and sowing_date are required',
        });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(sowing_date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD',
        });
      }

      const calendar = await calendarService.regenerateCalendar(
        parseInt(farm_id),
        user_id,
        crop_name,
        sowing_date
      );

      res.status(201).json({
        success: true,
        message: 'Calendar regenerated successfully',
        data: calendar,
      });
    } catch (error) {
      console.error('Error regenerating calendar:', error);
      const status = error.status || 400;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /crop-calendar/:farm_id
   * Generate new calendar for a farm
   */
  generateCalendar = async (req, res) => {
    try {
      const { farm_id } = req.params;
      const { crop_name, sowing_date } = req.body;
      const user_id = req.user.id; // From auth middleware

      // Validate required fields
      if (!farm_id) {
        return res.status(400).json({
          success: false,
          message: 'farm_id is required',
        });
      }

      if (!crop_name || !sowing_date) {
        return res.status(400).json({
          success: false,
          message: 'crop_name and sowing_date are required',
        });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(sowing_date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD',
        });
      }

      const calendar = await calendarService.generateCalendar(
        parseInt(farm_id),
        user_id,
        crop_name,
        sowing_date
      );

      res.status(201).json({
        success: true,
        message: 'Calendar generated successfully',
        data: calendar,
      });
    } catch (error) {
      console.error('Error generating calendar:', error);
      const status = error.status || 400;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /crops/:crop_name
   * Get detailed information about a specific crop
   */
  getCropDetails = async (req, res) => {
    try {
      const { crop_name } = req.params;

      if (!crop_name) {
        return res.status(400).json({
          success: false,
          message: 'crop_name is required',
        });
      }

      const cropDetails = calendarService.getCropDetails(crop_name);

      res.status(200).json({
        success: true,
        data: cropDetails,
      });
    } catch (error) {
      console.error('Error fetching crop details:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /calendar/parcelle/:parcelle_id
   * Get all calendars for a parcelle
   */
  getCalendarsByParcelleId = async (req, res) => {
    try {
      const { parcelle_id } = req.params;

      const calendars = await calendarService.getCalendarsByParcelleId(parseInt(parcelle_id));

      res.status(200).json({
        success: true,
        data: calendars,
      });
    } catch (error) {
      console.error('Error fetching calendars:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new CalendarController();
