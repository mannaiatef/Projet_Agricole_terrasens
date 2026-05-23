const parcelleRepository = require('../repositories/parcelle.repository');
const cropRepository = require('../repositories/crop.repository');
const calendarService = require('../services/calendar.service');
const Parcelle = require('../entities/parcelle.entity');
const CropEngine = require('../domain/logic/crop-engine');
const { ParcelleDTO, ParcelleGeoDTO, CreateParcelleDTO, UpdateParcelleDTO } = require('../dtos/parcelle.dto');
const GeoJSONValidator = require('../utils/geojson-validator');
const logger = require('../utils/logger');

class ParcelleController {
  /**
   * Get all parcelles for the authenticated user
   * GET /parcelles
   */
  getParcelles = async (req, res) => {
    try {
      const user_id = req.user.id; // From JWT token

      const parcelles = await parcelleRepository.findByUserId(user_id);

      res.status(200).json({
        success: true,
        message: 'Parcelles retrieved successfully',
        data: parcelles.map((p) => new ParcelleDTO(p).toJSON()),
        count: parcelles.length,
      });
    } catch (error) {
      logger.error('ParcelleController.getParcelles() error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error retrieving parcelles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get a single parcelle by ID
   * GET /parcelles/:id
   */
  getParcelleById = async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const parcelle = await parcelleRepository.findById(id);

      if (!parcelle) {
        return res.status(404).json({
          success: false,
          message: 'Parcelle not found',
        });
      }

      // Verify ownership
      if (parcelle.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Parcelle retrieved successfully',
        data: new ParcelleDTO(parcelle).toJSON(),
      });
    } catch (error) {
      logger.error('ParcelleController.getParcelleById() error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error retrieving parcelle',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Create a new parcelle
   * POST /parcelles
   * 
   * Required user input: name, surface
   * Required from maps: polygon, lang, latitude, longitude
   * Auto-set to null: crop_id, sowing_date
   */
  createParcelle = async (req, res) => {
    try {
      const user_id = req.user.id;
      let { name, surface, polygon, lang, latitude, longitude } = req.body;

      // Validate required user input fields
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'name is required and must be a non-empty string',
        });
      }

      if (surface === undefined || surface === null) {
        return res.status(400).json({
          success: false,
          message: 'surface is required',
        });
      }

      // Convert surface to number if it's a string
      if (typeof surface === 'string') {
        surface = parseFloat(surface);
      }

      if (isNaN(surface)) {
        return res.status(400).json({
          success: false,
          message: 'surface must be a valid number',
        });
      }

      // Validate required map fields
      if (!polygon) {
        return res.status(400).json({
          success: false,
          message: 'polygon is required (from maps)',
        });
      }

      if (!lang || typeof lang !== 'string' || lang.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'lang is required (from maps)',
        });
      }

      // Convert string numbers to actual numbers
      if (typeof latitude === 'string') {
        latitude = parseFloat(latitude);
      }
      if (typeof longitude === 'string') {
        longitude = parseFloat(longitude);
      }

      if (isNaN(latitude) || latitude === null || latitude === undefined) {
        return res.status(400).json({
          success: false,
          message: 'latitude is required and must be a valid number (from maps)',
        });
      }

      if (isNaN(longitude) || longitude === null || longitude === undefined) {
        return res.status(400).json({
          success: false,
          message: 'longitude is required and must be a valid number (from maps)',
        });
      }

      // Validate latitude and longitude ranges
      const latValidation = GeoJSONValidator.validateLatitude(latitude);
      if (!latValidation.valid) {
        return res.status(400).json({
          success: false,
          message: latValidation.error,
        });
      }

      const lonValidation = GeoJSONValidator.validateLongitude(longitude);
      if (!lonValidation.valid) {
        return res.status(400).json({
          success: false,
          message: lonValidation.error,
        });
      }

      // Validate polygon GeoJSON
      const polygonValidation = GeoJSONValidator.validatePolygon(polygon);
      if (!polygonValidation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid polygon GeoJSON',
          details: polygonValidation.errors,
        });
      }

      // Create parcelle entity with all map data and null optional fields
      const parcelle = new Parcelle(
        null,
        user_id,
        name.trim(),
        latitude,
        longitude,
        polygon,
        surface,
        lang.trim(),
        null,  // crop_id
        null   // sowing_date
      );

      // Save to database
      const createdParcelle = await parcelleRepository.create(parcelle);

      logger.info(`Parcelle created successfully: ${createdParcelle.id} for user ${user_id}`);

      res.status(201).json({
        success: true,
        message: 'Parcelle created successfully',
        data: new ParcelleDTO(createdParcelle).toJSON(),
      });
    } catch (error) {
      logger.error('ParcelleController.createParcelle() error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error creating parcelle',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Update a parcelle
   * PUT /parcelles/:id
   * 
   * Can update: name, surface, polygon, lang, latitude, longitude
   * Cannot update: crop_id, sowing_date (use assign-crop endpoint instead)
   */
  updateParcelle = async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;
      let { name, surface, polygon, lang, latitude, longitude } = req.body;

      // Convert string numbers to actual numbers
      if (typeof latitude === 'string') {
        latitude = parseFloat(latitude);
      }
      if (typeof longitude === 'string') {
        longitude = parseFloat(longitude);
      }
      if (typeof surface === 'string') {
        surface = parseFloat(surface);
      }

      // Check if parcelle exists
      const parcelle = await parcelleRepository.findById(id);

      if (!parcelle) {
        return res.status(404).json({
          success: false,
          message: 'Parcelle not found',
        });
      }

      // Verify ownership
      if (parcelle.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Validate updated geo fields if provided
      if (latitude !== undefined && latitude !== null) {
        if (isNaN(latitude)) {
          return res.status(400).json({
            success: false,
            message: 'latitude must be a valid number',
          });
        }
        const latValidation = GeoJSONValidator.validateLatitude(latitude);
        if (!latValidation.valid) {
          return res.status(400).json({
            success: false,
            message: latValidation.error,
          });
        }
      }

      if (longitude !== undefined && longitude !== null) {
        if (isNaN(longitude)) {
          return res.status(400).json({
            success: false,
            message: 'longitude must be a valid number',
          });
        }
        const lonValidation = GeoJSONValidator.validateLongitude(longitude);
        if (!lonValidation.valid) {
          return res.status(400).json({
            success: false,
            message: lonValidation.error,
          });
        }
      }

      if (polygon !== undefined) {
        const polygonValidation = GeoJSONValidator.validatePolygon(polygon);
        if (!polygonValidation.valid) {
          return res.status(400).json({
            success: false,
            message: 'Invalid polygon GeoJSON',
            details: polygonValidation.errors,
          });
        }
      }

      // Update fields
      if (name !== undefined) parcelle.name = name.trim();
      if (latitude !== undefined) parcelle.latitude = latitude;
      if (longitude !== undefined) parcelle.longitude = longitude;
      if (polygon !== undefined) parcelle.polygon = polygon;
      if (surface !== undefined) parcelle.surface = surface;
      if (lang !== undefined) parcelle.lang = lang.trim();

      // Save to database
      const updatedParcelle = await parcelleRepository.update(parcelle);

      logger.info(`Parcelle updated successfully: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Parcelle updated successfully',
        data: new ParcelleDTO(updatedParcelle).toJSON(),
      });
    } catch (error) {
      logger.error('ParcelleController.updateParcelle() error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error updating parcelle',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Assign a crop to a parcelle
   * POST /parcelles/:id/assign-crop
   */
  assignCrop = async (req, res) => {
    try {
      logger.debug('ParcelleController.assignCrop() called', { params: req.params, body: req.body });

      const { id } = req.params;
      const user_id = req.user.id;
      const { crop_id, sowing_date } = req.body;

      // Validate required fields
      if (!crop_id || !sowing_date) {
        return res.status(400).json({
          success: false,
          message: 'crop_id and sowing_date are required',
        });
      }

      // Convert crop_id to number
      const cropIdNum = parseInt(crop_id);

      // Get available crops and map ID to crop name
      const availableCrops = CropEngine.getAvailableCrops();
      const selectedCrop = availableCrops.find((c) => c.id === cropIdNum);

      if (!selectedCrop) {
        return res.status(404).json({
          success: false,
          message: 'Crop not found',
        });
      }

      // Find and verify parcelle ownership
      const parcelle = await parcelleRepository.findById(id);

      if (!parcelle) {
        return res.status(404).json({
          success: false,
          message: 'Parcelle not found',
        });
      }

      if (parcelle.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Resolve database crop_id from crop name
      logger.debug('Resolving crop in database', { cropName: selectedCrop.name });
      let databaseCrop = await cropRepository.findByName(selectedCrop.name);

      if (!databaseCrop) {
        const Crop = require('../entities/crop.entity');
        const newCrop = new Crop(null, selectedCrop.name, selectedCrop.duration_days);
        databaseCrop = await cropRepository.create(newCrop);
        logger.info(`Crop created in database: ${selectedCrop.name}`);
      }

      // Assign crop and save
      parcelle.crop_id = databaseCrop.id;
      parcelle.sowing_date = sowing_date;
      const updatedParcelle = await parcelleRepository.update(parcelle);

      // Automatically generate calendar for the assigned crop
      let calendarGenerated = false;
      let calendarError = null;

      try {
        const calendar = await calendarService.generateCalendar(
          parseInt(id),
          user_id,
          selectedCrop.name,
          sowing_date
        );
        logger.info(`Calendar generated for parcelle: ${id}`);
        calendarGenerated = true;
      } catch (error) {
        logger.error(`Calendar generation error for parcelle ${id}:`, error.message);
        calendarError = error.message;
        // Don't fail the crop assignment if calendar generation fails
      }

      res.status(200).json({
        success: true,
        message: 'Crop assigned successfully',
        data: {
          ...new ParcelleDTO(updatedParcelle).toJSON(),
          crop_name: selectedCrop.name,
          calendar_generated: calendarGenerated,
          calendar_generation_error: calendarError || null,
        },
      });
    } catch (error) {
      logger.error('ParcelleController.assignCrop() error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error assigning crop',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Delete a parcelle
   * DELETE /parcelles/:id
   */
  deleteParcelle = async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const parcelle = await parcelleRepository.findById(id);

      if (!parcelle) {
        return res.status(404).json({
          success: false,
          message: 'Parcelle not found',
        });
      }

      // Verify ownership
      if (parcelle.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      await parcelleRepository.delete(id);

      logger.info(`Parcelle deleted successfully: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Parcelle deleted successfully',
      });
    } catch (error) {
      logger.error('ParcelleController.deleteParcelle() error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error deleting parcelle',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Generate calendar for a parcelle
   * POST /parcelles/:id/calendar/generate
   */
  generateCalendarForParcelle = async (req, res) => {
    try {
      logger.debug('ParcelleController.generateCalendarForParcelle() called', { params: req.params });

      const { id } = req.params;
      const user_id = req.user.id;
      const { crop_id, sowing_date } = req.body;

      // Validate required fields
      if (!crop_id || !sowing_date) {
        return res.status(400).json({
          success: false,
          message: 'crop_id and sowing_date are required',
        });
      }

      // Convert crop_id to number
      const cropIdNum = parseInt(crop_id);

      // Get available crops and map ID to crop name
      const availableCrops = CropEngine.getAvailableCrops();
      const selectedCrop = availableCrops.find((c) => c.id === cropIdNum);

      if (!selectedCrop) {
        return res.status(404).json({
          success: false,
          message: 'Crop not found',
        });
      }

      // Verify parcelle ownership
      const parcelle = await parcelleRepository.findById(id);
      if (!parcelle) {
        return res.status(404).json({
          success: false,
          message: 'Parcelle not found',
        });
      }

      if (parcelle.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Generate calendar
      logger.info(`Generating calendar for parcelle: ${id}`);
      const calendar = await calendarService.generateCalendar(parseInt(id), user_id, selectedCrop.name, sowing_date);

      res.status(201).json({
        success: true,
        message: 'Calendar generated successfully',
        data: calendar,
      });
    } catch (error) {
      logger.error('ParcelleController.generateCalendarForParcelle() error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error generating calendar',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * INTERNAL API - Get all parcelles without authentication
   * Used by stress-service for service-to-service communication
   * GET /parcelles/internal
   */
  getParcellesInternal = async (req, res) => {
    try {
      const parcelles = await parcelleRepository.findAll();

      res.status(200).json({
        success: true,
        message: 'Parcelles retrieved successfully',
        data: parcelles.map((p) => new ParcelleGeoDTO(p).toJSON()),
        count: parcelles.length,
      });
    } catch (error) {
      logger.error('ParcelleController.getParcellesInternal() error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error retrieving parcelles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * INTERNAL API - Get a single parcelle by ID without authentication
   * Used by stress-service for service-to-service communication
   * GET /parcelles/internal/:id
   */
  getParcelleByIdInternal = async (req, res) => {
    try {
      const { id } = req.params;

      const parcelle = await parcelleRepository.findById(id);

      if (!parcelle) {
        return res.status(404).json({
          success: false,
          message: 'Parcelle not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Parcelle retrieved successfully',
        data: new ParcelleGeoDTO(parcelle).toJSON(),
      });
    } catch (error) {
      logger.error('ParcelleController.getParcelleByIdInternal() error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error retrieving parcelle',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = new ParcelleController();

  /**
   * Create a new parcelle
   * POST /parcelles
   */
  createParcelle = async (req, res) => {
    try {
      const { name, location, surface } = req.body;
      const user_id = req.user.id;

      // Validate required fields
      if (!name || !location || !surface) {
        return res.status(400).json({
          success: false,
          message: 'name, location, and surface are required',
        });
      }

      const parcelle = new Parcelle(null, user_id, name, location, surface);
      const createdParcelle = await parcelleRepository.create(parcelle);

      res.status(201).json({
        success: true,
        message: 'Parcelle created successfully',
        data: createdParcelle.toJSON(),
      });
    } catch (error) {
      console.error('ParcelleController.createParcelle() error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating parcelle',
        error: error.message,
      });
    }
  }

  /**
   * Update a parcelle
   * PUT /parcelles/:id
   */
  updateParcelle = async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;
      const { name, location, surface, crop_id, sowing_date } = req.body;

      const parcelle = await parcelleRepository.findById(id);

      if (!parcelle) {
        return res.status(404).json({
          success: false,
          message: 'Parcelle not found',
        });
      }

      // Verify ownership
      if (parcelle.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Update fields
      if (name) parcelle.name = name;
      if (location) parcelle.location = location;
      if (surface) parcelle.surface = surface;
      if (crop_id !== undefined) parcelle.crop_id = crop_id;
      if (sowing_date) parcelle.sowing_date = sowing_date;

      const updatedParcelle = await parcelleRepository.update(parcelle);

      res.status(200).json({
        success: true,
        message: 'Parcelle updated successfully',
        data: updatedParcelle.toJSON(),
      });
    } catch (error) {
      console.error('ParcelleController.updateParcelle() error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating parcelle',
        error: error.message,
      });
    }
  }

  /**
   * Assign a crop to a parcelle
   * POST /parcelles/:id/assign-crop
   */
  assignCrop = async (req, res) => {
    try {
      console.log('[ParcelleController] assignCrop() called');
      console.log('[ParcelleController] Params:', req.params);
      console.log('[ParcelleController] Body:', req.body);

      const { id } = req.params;
      const user_id = req.user.id;
      const { crop_id, sowing_date } = req.body;

      // Validate required fields
      if (!crop_id || !sowing_date) {
        console.log('[ParcelleController] Missing required fields');
        return res.status(400).json({
          success: false,
          message: 'crop_id and sowing_date are required',
        });
      }

      // Convert crop_id to number
      const cropIdNum = parseInt(crop_id);
      console.log(`[ParcelleController] Converted crop_id to number: ${cropIdNum}`);

      // Get available crops and map ID to crop name
      const availableCrops = CropEngine.getAvailableCrops();
      console.log(`[ParcelleController] Available crops count: ${availableCrops.length}`);

      const selectedCrop = availableCrops.find(c => c.id === cropIdNum);
      if (!selectedCrop) {
        console.log(`[ParcelleController] Crop not found with id: ${cropIdNum}`);
        return res.status(404).json({
          success: false,
          message: 'Crop not found',
        });
      }

      console.log(`[ParcelleController] Found crop: ${selectedCrop.name}`);

      // Find parcelle
      console.log('[ParcelleController] Finding parcelle:', id);
      const parcelle = await parcelleRepository.findById(id);

      if (!parcelle) {
        console.log('[ParcelleController] Parcelle not found:', id);
        return res.status(404).json({
          success: false,
          message: 'Parcelle not found',
        });
      }

      console.log('[ParcelleController] Parcelle found:', parcelle.name);

      // Verify ownership
      if (parcelle.user_id !== user_id) {
        console.log('[ParcelleController] Access denied - ownership check failed');
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Resolve database crop_id from crop name
      console.log('[ParcelleController] Resolving crop in database:', selectedCrop.name);
      let databaseCrop = await cropRepository.findByName(selectedCrop.name);
      
      if (!databaseCrop) {
        console.log('[ParcelleController] Crop not in database, creating:', selectedCrop.name);
        const Crop = require('../entities/crop.entity');
        const newCrop = new Crop(null, selectedCrop.name, selectedCrop.duration_days);
        databaseCrop = await cropRepository.create(newCrop);
        console.log('[ParcelleController] Crop created with database ID:', databaseCrop.id);
      } else {
        console.log('[ParcelleController] Crop found in database with ID:', databaseCrop.id);
      }

      // Assign crop - store the actual database crop_id
      console.log('[ParcelleController] Assigning crop to parcelle with database crop_id:', databaseCrop.id);
      parcelle.crop_id = databaseCrop.id;
      parcelle.sowing_date = sowing_date;

      const updatedParcelle = await parcelleRepository.update(parcelle);
      console.log('[ParcelleController] Parcelle updated successfully');

      // Automatically generate calendar for the assigned crop
      console.log('[ParcelleController] Generating calendar automatically...');
      let calendarGenerated = false;
      let calendarError = null;
      
      try {
        const calendar = await calendarService.generateCalendar(
          parseInt(id),
          user_id,
          selectedCrop.name,
          sowing_date
        );
        console.log('[ParcelleController] Calendar generated successfully:', calendar.id);
        calendarGenerated = true;
      } catch (error) {
        console.error('[ParcelleController] Error generating calendar:', error.message);
        console.error('[ParcelleController] Calendar generation error details:', error);
        calendarError = error.message;
        // Don't fail the crop assignment if calendar generation fails
        // Just log it and continue
      }

      res.status(200).json({
        success: true,
        message: 'Crop assigned successfully',
        data: {
          ...updatedParcelle.toJSON(),
          crop_name: selectedCrop.name,
          calendar_generated: calendarGenerated,
          calendar_generation_error: calendarError || null,
        },
      });
    } catch (error) {
      console.error('ParcelleController.assignCrop() error:', error);
      res.status(500).json({
        success: false,
        message: 'Error assigning crop',
        error: error.message,
      });
    }
  }

  /**
   * Delete a parcelle
   * DELETE /parcelles/:id
   */
  deleteParcelle = async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const parcelle = await parcelleRepository.findById(id);

      if (!parcelle) {
        return res.status(404).json({
          success: false,
          message: 'Parcelle not found',
        });
      }

      // Verify ownership
      if (parcelle.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      await parcelleRepository.delete(id);

      res.status(200).json({
        success: true,
        message: 'Parcelle deleted successfully',
      });
    } catch (error) {
      console.error('ParcelleController.deleteParcelle() error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting parcelle',
        error: error.message,
      });
    }
  }

  /**
   * Generate calendar for a parcelle
   * POST /parcelles/:id/calendar/generate
   */
  generateCalendarForParcelle = async (req, res) => {
    try {
      console.log('[ParcelleController] generateCalendarForParcelle() called');
      console.log('[ParcelleController] Params:', req.params);
      console.log('[ParcelleController] Body:', req.body);

      const { id } = req.params;
      const user_id = req.user.id;
      const { crop_id, sowing_date } = req.body;

      // Validate required fields
      if (!crop_id || !sowing_date) {
        console.log('[ParcelleController] Missing required fields');
        return res.status(400).json({
          success: false,
          message: 'crop_id and sowing_date are required',
        });
      }

      // Convert crop_id to number
      const cropIdNum = parseInt(crop_id);

      // Get available crops and map ID to crop name
      const availableCrops = CropEngine.getAvailableCrops();
      const selectedCrop = availableCrops.find(c => c.id === cropIdNum);
      
      if (!selectedCrop) {
        console.log(`[ParcelleController] Crop not found with id: ${cropIdNum}`);
        return res.status(404).json({
          success: false,
          message: 'Crop not found',
        });
      }

      // Verify parcelle ownership
      const parcelle = await parcelleRepository.findById(id);
      if (!parcelle) {
        return res.status(404).json({
          success: false,
          message: 'Parcelle not found',
        });
      }

      if (parcelle.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Generate calendar
      console.log('[ParcelleController] Generating calendar for parcelle:', id);
      const calendar = await calendarService.generateCalendar(
        parseInt(id),
        user_id,
        selectedCrop.name,
        sowing_date
      );

      res.status(201).json({
        success: true,
        message: 'Calendar generated successfully',
        data: calendar,
      });
    } catch (error) {
      console.error('ParcelleController.generateCalendarForParcelle() error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating calendar',
        error: error.message,
      });
    }
  }

  /**
   * INTERNAL API - Get all parcelles without authentication
   * Used by stress-service for service-to-service communication
   * GET /parcelles/internal
   */
  getParcellesInternal = async (req, res) => {
    try {
      const parcelles = await parcelleRepository.findAll();

      res.status(200).json({
        success: true,
        message: 'Parcelles retrieved successfully',
        data: parcelles.map((p) => p.toJSON()),
      });
    } catch (error) {
      console.error('ParcelleController.getParcellesInternal() error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving parcelles',
        error: error.message,
      });
    }
  }

  /**
   * INTERNAL API - Get a single parcelle by ID without authentication
   * Used by stress-service for service-to-service communication
   * GET /parcelles/internal/:id
   */
  getParcelleByIdInternal = async (req, res) => {
    try {
      const { id } = req.params;

      const parcelle = await parcelleRepository.findById(id);

      if (!parcelle) {
        return res.status(404).json({
          success: false,
          message: 'Parcelle not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Parcelle retrieved successfully',
        data: parcelle.toJSON(),
      });
    } catch (error) {
      console.error('ParcelleController.getParcelleByIdInternal() error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving parcelle',
        error: error.message,
      });
    }
  }


module.exports = new ParcelleController();
