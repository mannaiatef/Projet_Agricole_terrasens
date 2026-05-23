/**
 * CALENDAR SERVICE
 * 
 * Handles calendar generation, retrieval, and management.
 * Integrates with CropEngine for deterministic calendar calculation.
 */

const { pool } = require('../config/db');
const CropEngine = require('../domain/logic/crop-engine');

class CalendarService {
  /**
   * Generate a new calendar for a farm (parcelle)
   * Uses CropEngine for deterministic calculation
   * @param {number} farmId - The farm ID (parcelle_id)
   * @param {number} userId - The user ID (for ownership verification)
   * @param {string} cropName - The crop name (e.g., 'Blé')
   * @param {string} sowingDate - The sowing date (YYYY-MM-DD)
   * @returns {Promise<Object>} - Generated calendar
   */
  async generateCalendar(farmId, userId, cropName, sowingDate) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify farm ownership
      console.log(`[CalendarService] Verifying farm ownership: farmId=${farmId}, userId=${userId}`);
      await this._verifyFarmOwnership(connection, farmId, userId);

      // Generate calendar using deterministic engine
      console.log(`[CalendarService] Generating calendar for crop: ${cropName}, sowing date: ${sowingDate}`);
      const calendarData = CropEngine.generateCalendar(cropName, sowingDate);
      console.log(`[CalendarService] Calendar data generated: ${calendarData.stages.length} stages`);

      // Save calendar to database
      console.log(`[CalendarService] Saving calendar to database...`);
      const calendarId = await this._saveCalendarToDB(connection, farmId, calendarData);
      console.log(`[CalendarService] Calendar saved with ID: ${calendarId}`);

      await connection.commit();
      console.log(`[CalendarService] Transaction committed successfully`);

      return {
        id: calendarId,
        farm_id: farmId,
        crop_name: calendarData.crop_name,
        sowing_date: calendarData.sowing_date,
        total_duration_days: calendarData.total_duration_days,
        stages: calendarData.stages,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[CalendarService] Error in generateCalendar:`, error.message);
      console.error(`[CalendarService] SQL Error Code:`, error.code);
      console.error(`[CalendarService] SQL Error:`, error.sql);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get calendar for a farm
   * @param {number} farmId - The farm ID
   * @param {number} userId - The user ID (for ownership verification)
   * @returns {Promise<Object>} - Calendar with all stages
   */
  async getCalendarByFarmId(farmId, userId) {
    // Verify farm ownership
    await this._verifyFarmOwnership(null, farmId, userId);

    const connection = await pool.getConnection();

    try {
      // Get latest calendar for this farm WITH parcelle info
      const [results] = await connection.query(
        `SELECT c.id, c.parcelle_id, c.crop_id, c.sowing_date, c.created_at, p.name as parcelle_name
         FROM calendars c
         JOIN parcelles p ON c.parcelle_id = p.id
         WHERE c.parcelle_id = ? 
         ORDER BY c.created_at DESC LIMIT 1`,
        [farmId]
      );

      if (!results || results.length === 0) {
        return null;
      }

      const calendar = results[0];

      // Get all stages from calendar_stages, using COALESCE to prefer calendar_stages data over stages table
      const [stages] = await connection.query(
        `SELECT 
           cs.id,
           cs.calendar_id,
           cs.stage_id,
           ROW_NUMBER() OVER (ORDER BY cs.start_date) as stage_number,
           cs.start_date,
           cs.end_date,
           COALESCE(cs.stage_name, s.name) as name,
           s.stage_order,
           COALESCE(cs.duration_days, s.duration_days) as duration_days,
           COALESCE(cs.kc_value, s.kc_value) as kc_value,
           COALESCE(cs.color, s.color) as color,
           COALESCE(cs.description, s.description) as description,
           COALESCE(cs.actions, s.actions) as actions,
           COALESCE(cs.fertilization, s.fertilization) as fertilization,
           COALESCE(cs.alerts, s.alerts) as alerts
         FROM calendar_stages cs
         LEFT JOIN stages s ON cs.stage_id = s.id
         WHERE cs.calendar_id = ? 
         ORDER BY cs.start_date ASC`,
        [calendar.id]
      );

      // Calculate day_from_sowing for each stage and parse JSON fields
      const sowingDate = new Date(calendar.sowing_date);
      const stagesWithDayFromSowing = stages.map((stage, index) => {
        const startDate = new Date(stage.start_date);
        const dayFromSowing = Math.floor((startDate - sowingDate) / (1000 * 60 * 60 * 24)) + 1;
        
        // Parse JSON fields safely
        let actions = [];
        let alerts = [];
        let fertilization = null;
        
        try {
          if (stage.actions) {
            actions = typeof stage.actions === 'string' ? JSON.parse(stage.actions) : stage.actions;
            if (!Array.isArray(actions)) actions = [];
          }
        } catch (e) {
          console.warn(`[CalendarService] Failed to parse actions for stage ${stage.name}:`, e.message);
          actions = [];
        }
        
        try {
          if (stage.alerts) {
            alerts = typeof stage.alerts === 'string' ? JSON.parse(stage.alerts) : stage.alerts;
            if (!Array.isArray(alerts)) alerts = [];
          }
        } catch (e) {
          console.warn(`[CalendarService] Failed to parse alerts for stage ${stage.name}:`, e.message);
          alerts = [];
        }
        
        try {
          if (stage.fertilization) {
            fertilization = typeof stage.fertilization === 'string' ? JSON.parse(stage.fertilization) : stage.fertilization;
          }
        } catch (e) {
          console.warn(`[CalendarService] Failed to parse fertilization for stage ${stage.name}:`, e.message);
          fertilization = null;
        }
        
        return {
          number: stage.stage_number || index + 1,
          name: stage.name || `Stage ${index + 1}`,
          start_date: stage.start_date,
          end_date: stage.end_date,
          duration_days: parseInt(stage.duration_days) || 0,
          kc_value: parseFloat(stage.kc_value) || 1.0,
          day_from_sowing: dayFromSowing,
          description: stage.description || '',
          color: stage.color || '#8BC34A',
          actions: actions,
          alerts: alerts,
          fertilization: fertilization
        };
      });

      const cropName = await this._getCropName(connection, calendar.crop_id);

      // Reconstruct calendar object with full details matching frontend interface
      return {
        id: calendar.id,
        farm_id: calendar.parcelle_id,
        farm_name: calendar.parcelle_name,
        crop_id: calendar.crop_id,
        crop_name: cropName,
        crop_type: cropName,
        sowing_date: this._formatDate(calendar.sowing_date),
        total_days: stagesWithDayFromSowing.reduce((sum, s) => sum + (s.duration_days || 0), 0),
        stages: stagesWithDayFromSowing,
        created_at: calendar.created_at,
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Get current stage of a calendar
   * @param {number} farmId - The farm ID
   * @param {number} userId - The user ID (for ownership verification)
   * @param {string} currentDate - Current date (default: today)
   * @returns {Promise<Object>} - Current stage or null
   */
  async getCurrentStage(farmId, userId, currentDate = null) {
    const calendar = await this.getCalendarByFarmId(farmId, userId);

    if (!calendar) {
      throw new Error(`No calendar found for farm ${farmId}`);
    }

    // Reconstruct calendar object in CropEngine format
    const engineCalendar = {
      stages: calendar.stages,
    };

    // Use CropEngine to find current stage
    const currentStage = CropEngine.getCurrentStage(engineCalendar, currentDate);

    return currentStage;
  }

  /**
   * Regenerate calendar (delete old, create new)
   * @param {number} farmId - The farm ID
   * @param {number} userId - The user ID (for ownership verification)
   * @param {string} cropName - The crop name
   * @param {string} sowingDate - The sowing date
   * @returns {Promise<Object>} - New calendar
   */
  async regenerateCalendar(farmId, userId, cropName, sowingDate) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify ownership
      await this._verifyFarmOwnership(connection, farmId, userId);

      // Delete old calendars for this farm
      await connection.query(
        `DELETE FROM calendars WHERE parcelle_id = ?`,
        [farmId]
      );

      // Generate new calendar
      const calendarData = CropEngine.generateCalendar(cropName, sowingDate);

      // Resolve crop ID
      const cropId = await this._resolveCropId(connection, cropName);

      // Save to database
      const calendarId = await this._saveCalendarToDB(
        connection,
        farmId,
        calendarData
      );

      await connection.commit();

      return {
        id: calendarId,
        farm_id: farmId,
        crop_name: calendarData.crop_name,
        sowing_date: calendarData.sowing_date,
        total_duration_days: calendarData.total_duration_days,
        stages: calendarData.stages,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get available crops
   */
  getAvailableCrops() {
    return CropEngine.getAvailableCrops();
  }

  /**
   * Get crop details
   */
  getCropDetails(cropName) {
    return CropEngine.getCropDetails(cropName);
  }

  /**
   * Get all calendars for a parcelle
   * @param {number} parcelleId - The parcelle ID
   * @returns {Promise<Array>} - List of calendars with full details
   */
  async getCalendarsByParcelleId(parcelleId) {
    const connection = await pool.getConnection();

    try {
      // Get calendar and parcelle info (to get farm name)
      const [calendars] = await connection.query(
        `SELECT c.id, c.parcelle_id, c.crop_id, c.sowing_date, c.created_at, p.name as parcelle_name
         FROM calendars c
         JOIN parcelles p ON c.parcelle_id = p.id
         WHERE c.parcelle_id = ?`,
        [parcelleId]
      );

      if (!calendars || calendars.length === 0) {
        return [];
      }

      // Get full details for each calendar
      const result = [];
      for (const cal of calendars) {
        // Query calendar_stages with COALESCE to prefer calendar_stages data over stages table
        const [stages] = await connection.query(
          `SELECT 
             cs.id,
             cs.calendar_id,
             cs.stage_id,
             ROW_NUMBER() OVER (PARTITION BY cs.calendar_id ORDER BY cs.start_date) as stage_number,
             cs.start_date,
             cs.end_date,
             COALESCE(cs.stage_name, s.name) as name,
             s.stage_order,
             COALESCE(cs.duration_days, s.duration_days) as duration_days,
             COALESCE(cs.kc_value, s.kc_value) as kc_value,
             COALESCE(cs.color, s.color) as color,
             COALESCE(cs.description, s.description) as description,
             COALESCE(cs.actions, s.actions) as actions,
             COALESCE(cs.fertilization, s.fertilization) as fertilization,
             COALESCE(cs.alerts, s.alerts) as alerts
           FROM calendar_stages cs
           LEFT JOIN stages s ON cs.stage_id = s.id
           WHERE cs.calendar_id = ? 
           ORDER BY cs.start_date ASC`,
          [cal.id]
        );

        // Calculate day_from_sowing for each stage and parse JSON fields
        const sowingDate = new Date(cal.sowing_date);
        const stagesWithDayFromSowing = stages.map((stage, index) => {
          const startDate = new Date(stage.start_date);
          const dayFromSowing = Math.floor((startDate - sowingDate) / (1000 * 60 * 60 * 24)) + 1;
          
          // Parse JSON fields safely
          let actions = [];
          let alerts = [];
          let fertilization = null;
          
          try {
            if (stage.actions) {
              actions = typeof stage.actions === 'string' ? JSON.parse(stage.actions) : stage.actions;
              if (!Array.isArray(actions)) actions = [];
            }
          } catch (e) {
            console.warn(`[CalendarService] Failed to parse actions for stage ${stage.name}:`, e.message);
            actions = [];
          }
          
          try {
            if (stage.alerts) {
              alerts = typeof stage.alerts === 'string' ? JSON.parse(stage.alerts) : stage.alerts;
              if (!Array.isArray(alerts)) alerts = [];
            }
          } catch (e) {
            console.warn(`[CalendarService] Failed to parse alerts for stage ${stage.name}:`, e.message);
            alerts = [];
          }
          
          try {
            if (stage.fertilization) {
              fertilization = typeof stage.fertilization === 'string' ? JSON.parse(stage.fertilization) : stage.fertilization;
            }
          } catch (e) {
            console.warn(`[CalendarService] Failed to parse fertilization for stage ${stage.name}:`, e.message);
            fertilization = null;
          }
          
          return {
            number: stage.stage_number || index + 1,
            name: stage.name || `Stage ${index + 1}`,
            start_date: stage.start_date,
            end_date: stage.end_date,
            duration_days: parseInt(stage.duration_days) || 0,
            kc_value: parseFloat(stage.kc_value) || 1.0,
            day_from_sowing: dayFromSowing,
            description: stage.description || '',
            color: stage.color || '#8BC34A',
            actions: actions,
            alerts: alerts,
            fertilization: fertilization,
          };
        });

        const cropName = await this._getCropName(connection, cal.crop_id);

        result.push({
          id: cal.id,
          farm_id: cal.parcelle_id,
          farm_name: cal.parcelle_name,
          crop_id: cal.crop_id,
          crop_name: cropName,
          crop_type: cropName,
          sowing_date: this._formatDate(cal.sowing_date),
          total_days: stagesWithDayFromSowing.reduce((sum, s) => sum + (s.duration_days || 0), 0),
          stages: stagesWithDayFromSowing,
          created_at: cal.created_at,
        });
      }

      return result;
    } finally {
      connection.release();
    }
  }

  /**
   * PRIVATE: Verify farm ownership
   */
  async _verifyFarmOwnership(connection, farmId, userId) {
    let conn = connection;
    const shouldRelease = !connection;

    if (!conn) {
      conn = await pool.getConnection();
    }

    try {
      const [farms] = await conn.query(
        `SELECT id, user_id FROM parcelles WHERE id = ?`,
        [farmId]
      );

      if (!farms || farms.length === 0) {
        throw { status: 404, message: `Farm ${farmId} not found` };
      }

      const farm = farms[0];
      if (farm.user_id !== userId) {
        throw { status: 404, message: `Farm ${farmId} not found` };
      }

      return farm;
    } finally {
      if (shouldRelease) {
        conn.release();
      }
    }
  }

  /**
   * PRIVATE: Resolve crop ID from crop name
   */
  async _resolveCropId(connection, cropName) {
    const [crops] = await connection.query(
      `SELECT id FROM crops WHERE name = ?`,
      [cropName]
    );

    if (crops && crops.length > 0) {
      return crops[0].id;
    }

    // Create crop if it doesn't exist
    const resolvedCrop = CropEngine._resolveCrop(cropName);
    if (!resolvedCrop) {
      throw new Error(`Crop '${cropName}' not found in crop database`);
    }

    const [result] = await connection.query(
      `INSERT INTO crops (name, duration_days) VALUES (?, ?)`,
      [cropName, resolvedCrop.data.total_duration_days]
    );

    return result.insertId;
  }

  /**
   * PRIVATE: Get crop name from ID
   */
  async _getCropName(connection, cropId) {
    const [crops] = await connection.query(
      `SELECT name FROM crops WHERE id = ?`,
      [cropId]
    );

    return crops && crops.length > 0 ? crops[0].name : 'Unknown';
  }

  /**
   * PRIVATE: Save calendar to database
   */
  async _saveCalendarToDB(connection, farmId, calendarData) {
    // Resolve crop ID
    const cropId = await this._resolveCropId(connection, calendarData.crop_name);

    // Insert calendar
    const [result] = await connection.query(
      `INSERT INTO calendars (parcelle_id, crop_id, sowing_date) 
       VALUES (?, ?, ?)`,
      [farmId, cropId, calendarData.sowing_date]
    );

    const calendarId = result.insertId;
    console.log(`[CalendarService] Calendar inserted with ID: ${calendarId}`);

    // Insert stages with complete data
    for (const stage of calendarData.stages) {
      // Resolve stage ID
      const stageId = await this._resolveStageId(
        connection,
        cropId,
        stage.number,
        stage.name,
        stage.duration_days,
        stage.kc_value,
        stage.color,
        stage.description,
        stage.actions,
        stage.alerts,
        stage.fertilization
      );

      console.log(`[CalendarService] Stage ${stage.number}: ${stage.name}\n  Duration: ${stage.duration_days}d, Kc: ${stage.kc_value}\n  Actions: ${stage.actions?.length || 0}, Alerts: ${stage.alerts?.length || 0}, Fert: ${stage.fertilization ? 'YES' : 'NO'}`);

      // Insert calendar_stage with progressive fallback strategy
      // LEVEL 1: Try with all columns (complete data)
      try {
        console.log(`[CalendarService] ↳ LEVEL 1: Inserting with actions/alerts/fertilization...`);
        await connection.query(
          `INSERT INTO calendar_stages 
           (calendar_id, stage_id, stage_name, start_date, end_date, duration_days, kc_value, actions, alerts, fertilization) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            calendarId,
            stageId,
            stage.name,
            stage.start_date,
            stage.end_date,
            stage.duration_days,
            stage.kc_value,
            stage.actions ? JSON.stringify(stage.actions) : null,
            stage.alerts ? JSON.stringify(stage.alerts) : null,
            stage.fertilization ? JSON.stringify(stage.fertilization) : null,
          ]
        );
        console.log(`[CalendarService] ✓ LEVEL 1 successful`);
      } catch (error1) {
        // Log full error for debugging
        console.log(`[CalendarService] ✗ LEVEL 1 ERROR:`);
        console.log(`    Code: ${error1.code}`);
        console.log(`    Message: ${error1.message}`);
        console.log(`    SQL: ${error1.sql}`);
        
        // LEVEL 2: If JSON columns don't exist, try without them but keep core fields
        if (error1.code === 'ER_BAD_FIELD_ERROR' || error1.message.includes('Unknown column')) {
          console.log(`[CalendarService] ↳ LEVEL 2: Inserting without JSON columns...`);
          try {
            await connection.query(
              `INSERT INTO calendar_stages 
               (calendar_id, stage_id, stage_name, start_date, end_date, duration_days, kc_value) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                calendarId,
                stageId,
                stage.name,
                stage.start_date,
                stage.end_date,
                stage.duration_days,
                stage.kc_value,
              ]
            );
            console.log(`[CalendarService] ✓ LEVEL 2 successful (WARNING: No JSON columns)`);
          } catch (error2) {
            // Log error2 details
            console.log(`[CalendarService] ✗ LEVEL 2 ERROR:`);
            console.log(`    Code: ${error2.code}`);
            console.log(`    Message: ${error2.message}`);
            console.log(`    SQL: ${error2.sql}`);
            
            // LEVEL 3: If even core columns fail, use absolute minimal insert
            if (error2.code === 'ER_BAD_FIELD_ERROR' || error2.message.includes('Unknown column')) {
              console.log(`[CalendarService] ↳ LEVEL 3: Inserting minimal columns (fallback)...`);
              await connection.query(
                `INSERT INTO calendar_stages 
                 (calendar_id, stage_id, start_date, end_date) 
                 VALUES (?, ?, ?, ?)`,
                [
                  calendarId,
                  stageId,
                  stage.start_date,
                  stage.end_date,
                ]
              );
              console.log(`[CalendarService] ✓ LEVEL 3 successful (CRITICAL: Minimal data only)`);
            } else {
              console.log(`[CalendarService] ✗ LEVEL 2 error is not schema-related, throwing...`);
              throw error2;
            }
          }
        } else {
          console.log(`[CalendarService] ✗ LEVEL 1 error is not schema-related, throwing...`);
          throw error1;
        }
      }
    }

    console.log(`[CalendarService] ✓ All ${calendarData.stages.length} stages inserted for calendar ${calendarId}`);
    return calendarId;
  }

  /**
   * PRIVATE: Resolve or create stage ID
   */
  async _resolveStageId(
    connection,
    cropId,
    stageOrder,
    stageName,
    durationDays,
    kcValue,
    color,
    description,
    actions,
    alerts,
    fertilization
  ) {
    const [stages] = await connection.query(
      `SELECT id FROM stages WHERE crop_id = ? AND stage_order = ?`,
      [cropId, stageOrder]
    );

    if (stages && stages.length > 0) {
      return stages[0].id;
    }

    // Create stage if it doesn't exist
    // Insert only the essential columns that guaranteed to exist in stages table
    const [result] = await connection.query(
      `INSERT INTO stages (crop_id, name, stage_order, duration_days, kc_value) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        cropId,
        stageName,
        stageOrder,
        durationDays,
        kcValue,
      ]
    );

    return result.insertId;
  }

  /**
   * Helper function to format date as YYYY-MM-DD
   */
  _formatDate(date) {
    if (typeof date === 'string') return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

module.exports = new CalendarService();
