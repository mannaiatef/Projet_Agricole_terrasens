/**
 * CROP ENGINE (MIGRATED FROM PYTHON)
 * 
 * Core business logic for crop calendar generation.
 * Implements the deterministic algorithm for calendar calculation (FAO-56 + field expertise).
 * Supports 8 crops: Blé, Orge, Maïs, Tomate, Piment, Pomme de terre, Olivier, Vigne
 * 
 * Algorithm:
 * 1. Input: crop_type, sowing_date
 * 2. Resolve crop name (with aliases)
 * 3. Lookup CROP_KNOWLEDGE_BASE[crop]
 * 4. FOR each stage:
 *    - start_date = current_date
 *    - end_date = start_date + (duration_days - 1)
 *    - day_from_sowing = (start_date - sowing_date) + 1
 *    - IF fertilization exists:
 *        fert_date = start_date + day_from_start
 *    - Append stage to list
 *    - current_date = end_date + 1
 * 5. Return full calendar with all stages, dates, actions, alerts, fertilization
 */

const { CROP_KNOWLEDGE_BASE, CROP_ALIASES } = require('../crops/crop-knowledge-base');

class CropEngine {
  /**
   * Generate a crop calendar
   * @param {string} cropType - Crop type (e.g., 'Blé')
   * @param {string} sowingDate - Sowing date (ISO format YYYY-MM-DD)
   * @returns {Object} - Generated calendar with all stages
   */
  static generateCalendar(cropType, sowingDate) {
    // Validate inputs
    if (!cropType || !sowingDate) {
      throw new Error('cropType and sowingDate are required');
    }

    // Validate date format
    if (!this._isValidDate(sowingDate)) {
      throw new Error('Invalid sowing date format. Use YYYY-MM-DD');
    }

    // Resolve crop from knowledge base
    const resolvedCrop = this._resolveCrop(cropType);
    if (!resolvedCrop) {
      const availableCrops = this.getAvailableCrops();
      throw new Error(`Crop '${cropType}' not found. Available: ${availableCrops.map(c => c.name).join(', ')}`);
    }

    // Generate calendar using deterministic algorithm
    const calendar = this._calculateCalendar(resolvedCrop.name, resolvedCrop.data, sowingDate);

    return calendar;
  }

  /**
   * Private: Validate date format YYYY-MM-DD
   */
  static _isValidDate(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Private: Resolve crop from knowledge base with alias support (case-insensitive)
   */
  static _resolveCrop(cropType) {
    // Try alias first
    const resolvedName = CROP_ALIASES[cropType];
    if (resolvedName && CROP_KNOWLEDGE_BASE[resolvedName]) {
      return { name: resolvedName, data: CROP_KNOWLEDGE_BASE[resolvedName] };
    }

    // Try exact match
    if (CROP_KNOWLEDGE_BASE[cropType]) {
      return { name: cropType, data: CROP_KNOWLEDGE_BASE[cropType] };
    }

    // Try case-insensitive match
    const cropKey = Object.keys(CROP_KNOWLEDGE_BASE).find(
      (key) => key.toLowerCase() === cropType.toLowerCase()
    );

    return cropKey ? { name: cropKey, data: CROP_KNOWLEDGE_BASE[cropKey] } : null;
  }

  /**
   * Private: Calculate calendar using the deterministic algorithm
   * ALGORITHM (EXACT IMPLEMENTATION FROM PYTHON):
   * 1. FOR each stage:
   *    - start_date = current_date
   *    - end_date = start_date + (duration_days - 1)
   *    - day_from_sowing = (start_date - sowing_date) + 1
   *    - IF fertilization exists:
   *        fert_date = start_date + day_from_start
   *    - Append stage to list
   *    - current_date = end_date + 1
   */
  static _calculateCalendar(cropName, crop, sowingDate) {
    const sowingDateObj = new Date(sowingDate + 'T00:00:00Z'); // Parse as UTC
    const stages = [];
    let currentDate = new Date(sowingDateObj);

    for (let i = 0; i < crop.stages.length; i++) {
      const stageData = crop.stages[i];
      const startDate = new Date(currentDate);

      // EXACT ALGORITHM: end_date = start_date + (duration_days - 1)
      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + stageData.duration_days - 1);

      // Calculate day from sowing (1-indexed)
      const dayFromSowing = this._daysBetween(sowingDateObj, startDate) + 1;

      // Calculate fertilization if exists
      let fertilizationInfo = null;
      if (stageData.fertilization) {
        const fertDate = new Date(startDate);
        const dayOffset = stageData.fertilization.day_from_start || 0;
        fertDate.setUTCDate(fertDate.getUTCDate() + dayOffset);

        fertilizationInfo = {
          type: stageData.fertilization.type,
          dose_kg_ha: stageData.fertilization.dose_kg_ha,
          product: stageData.fertilization.product,
          application_date: this._formatDate(fertDate)
        };
      }

      const stage = {
        number: i + 1,            // Database expects 'number'
        name: stageData.name,     // Database expects 'name'
        description: '',          // Not in new KB, defaulting to empty
        color: '#8BC34A',         // Not in new KB, defaulting to green
        start_date: this._formatDate(startDate),
        end_date: this._formatDate(endDate),
        duration_days: stageData.duration_days,
        day_from_sowing: dayFromSowing,
        kc_value: stageData.kc_value,
        actions: stageData.actions || [],
        alerts: stageData.alerts || [],
        fertilization: fertilizationInfo
      };

      stages.push(stage);

      // EXACT ALGORITHM: current_date = end_date + 1 (next stage starts day after this one ends)
      currentDate = new Date(endDate);
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Calculate total duration
    const totalDurationDays = crop.stages.reduce((sum, s) => sum + s.duration_days, 0);

    return {
      crop_name: cropName,  // Python-compatible field name
      sowing_date: this._formatDate(sowingDateObj),
      total_duration_days: totalDurationDays,  // Python-compatible field name
      stages: stages
    };
  }

  /**
   * Private: Calculate days between two dates (inclusive of start, exclusive of end)
   */
  static _daysBetween(startDate, endDate) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.floor((endDate - startDate) / oneDay);
  }

  /**
   * Private: Format date as YYYY-MM-DD
   */
  static _formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get available crops with metadata
   * Returns array of objects with id, name, duration_days, and stage_count
   */
  static getAvailableCrops() {
    const cropNames = Object.keys(CROP_KNOWLEDGE_BASE);
    return cropNames.map((cropName, index) => {
      const cropData = CROP_KNOWLEDGE_BASE[cropName];
      return {
        id: index + 1, // Sequential ID: Blé=1, Orge=2, Maïs=3, Tomate=4, Piment=5, Pomme de terre=6, Olivier=7, Vigne=8
        name: cropName,
        duration_days: cropData.total_duration_days,
        stage_count: cropData.stages.length
      };
    });
  }

  /**
   * Get crop details with all stages
   */
  static getCropDetails(cropType) {
    const resolvedCrop = this._resolveCrop(cropType);
    if (!resolvedCrop) {
      throw new Error(`Crop '${cropType}' not found`);
    }

    const crop = resolvedCrop.data;
    return {
      name: resolvedCrop.name,
      stages: crop.stages,
      total_duration_days: crop.stages.reduce((sum, s) => sum + s.duration_days, 0)
    };
  }

  /**
   * Get current stage based on current date
   */
  static getCurrentStage(calendar, currentDate = null) {
    if (!calendar.stages || calendar.stages.length === 0) {
      return null;
    }

    const checkDate = currentDate ? new Date(currentDate) : new Date();
    const checkDateStr = this._formatDate(checkDate);

    const currentStage = calendar.stages.find((stage) => {
      return (
        checkDateStr >= stage.start_date &&
        checkDateStr <= stage.end_date
      );
    });

    return currentStage || null;
  }

  /**
   * Validate calendar consistency
   */
  static validateCalendar(calendar) {
    const errors = [];

    if (!calendar.stages || calendar.stages.length === 0) {
      errors.push('Calendar has no stages');
      return errors;
    }

    // Verify stages are sequential with no gaps
    for (let i = 0; i < calendar.stages.length - 1; i++) {
      const currentStage = calendar.stages[i];
      const nextStage = calendar.stages[i + 1];

      const currentEndDate = new Date(currentStage.end_date);
      const nextStartDate = new Date(nextStage.start_date);

      currentEndDate.setDate(currentEndDate.getDate() + 1);

      if (this._formatDate(currentEndDate) !== nextStage.start_date) {
        errors.push(
          `Gap or overlap between stage ${i + 1} and ${i + 2}`
        );
      }
    }

    // Verify total duration
    const calculatedDuration = calendar.stages.reduce(
      (sum, s) => sum + s.duration_days,
      0
    );
    if (calculatedDuration !== calendar.total_duration_days) {
      errors.push(
        `Total duration mismatch: ${calculatedDuration} vs ${calendar.total_duration_days}`
      );
    }

    return errors;
  }
}

module.exports = CropEngine;
