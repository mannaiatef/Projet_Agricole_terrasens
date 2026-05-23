const fs = require('fs');
const apiClient = require('../utils/apiClient');
const logger = require('../utils/logger');

class ToolExecutor {
  async executeTool(toolName, params, token) {
    try {
      logger.info(`Executing tool: ${toolName}`, { params });

      switch (toolName) {
        case 'getStress':
          return await this.getStress(params.parcelleId, token);

        case 'getIrrigationStatus':
          return await this.getIrrigationStatus(params.parcelleId, token);

        case 'getCropCalendar':
          return await this.getCropCalendar(params.parcelleId, token);

        case 'detectDisease':
          return await this.detectDisease(params.imagePath, token);

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      logger.error(`Error executing tool ${toolName}`, error);
      throw error;
    }
  }

  async getStress(parcelleId, token) {
    try {
      logger.info('Getting stress data', { parcelleId });

      // Call the stress-service through API gateway
      const result = await apiClient.getStress(parcelleId, token);

      return {
        success: true,
        tool: 'getStress',
        data: result,
        summary: this.formatStressData(result),
      };
    } catch (error) {
      logger.error('Error in getStress', error);
      throw error;
    }
  }

  async getIrrigationStatus(parcelleId, token) {
    try {
      logger.info('Getting irrigation status', { parcelleId });

      // Call the irrigation-service through API gateway
      const result = await apiClient.getIrrigationStatus(parcelleId, token);

      return {
        success: true,
        tool: 'getIrrigationStatus',
        data: result,
        summary: this.formatIrrigationData(result),
      };
    } catch (error) {
      logger.error('Error in getIrrigationStatus', error);
      throw error;
    }
  }

  async getCropCalendar(parcelleId, token) {
    try {
      logger.info('Getting crop calendar', { parcelleId });

      // Call the crop-calendar-service through API gateway
      const result = await apiClient.getCropCalendar(parcelleId, token);

      return {
        success: true,
        tool: 'getCropCalendar',
        data: result,
        summary: this.formatCalendarData(result),
      };
    } catch (error) {
      logger.error('Error in getCropCalendar', error);
      throw error;
    }
  }

  async detectDisease(imagePath, token) {
    try {
      logger.info('Detecting disease from image', { imagePath });

      // Read the image file
      const imageBuffer = fs.readFileSync(imagePath);
      const fileName = imagePath.split('/').pop();

      // Call the disease-detection-service through API gateway
      const result = await apiClient.detectDisease(imageBuffer, fileName, token);

      return {
        success: true,
        tool: 'detectDisease',
        data: result,
        summary: this.formatDiseaseData(result),
      };
    } catch (error) {
      logger.error('Error in detectDisease', error);
      throw error;
    }
  }

  formatStressData(data) {
    if (!data || !data.data) return 'No stress data available';

    const responseData = data.data;
    const stress = responseData.record || responseData;
    
    // Map API response fields to readable format
    const ndvi = stress.mean_ndvi || stress.ndviScore || 'N/A';
    const stressLevel = stress.stress_percentage || stress.stressLevel || 'N/A';
    const timestamp = stress.created_at || stress.updated_at || stress.timestamp || 'N/A';
    
    // Determine stress status based on percentage
    let status = 'Monitor plant health';
    if (stressLevel !== 'N/A') {
      const stressPercent = parseFloat(stressLevel);
      if (stressPercent > 50) {
        status = '⚠️ HIGH stress detected - Irrigation needed urgently';
      } else if (stressPercent > 30) {
        status = '⚡ Moderate stress - Monitor closely and adjust irrigation';
      } else {
        status = '✅ Low stress - Good plant health condition';
      }
    }
    
    // Include alerts if available
    let alertInfo = '';
    if (responseData.alerts && responseData.alerts.length > 0) {
      alertInfo = '\n\n🚨 ALERTS:\n';
      responseData.alerts.forEach(alert => {
        alertInfo += `- ${alert.message || alert}\n`;
      });
    }

    return `Plant Stress Analysis:
- NDVI Score: ${ndvi}
- Stress Level: ${stressLevel}%
- Status: ${status}
- Last Updated: ${timestamp}${alertInfo}`;
  }

  formatIrrigationData(data) {
    if (!data || !data.data) return 'No irrigation data available';

    const irrigation = data.data;
    return `Irrigation Status:
- Current Moisture: ${irrigation.moistureLevel || 'N/A'}%
- Recommendation: ${irrigation.irrigationRecommendation || 'Check soil moisture'}
- Next Watering: ${irrigation.nextWateringTime || 'N/A'}
- Water Required: ${irrigation.waterRequired || 'N/A'} mm`;
  }

  formatCalendarData(data) {
    if (!data || !data.data) return 'No calendar data available';

    const calendar = data.data;
    const stages = Array.isArray(calendar.stages) 
      ? calendar.stages.map(s => `${s.name} (${s.startDate} - ${s.endDate})`).join('\n- ')
      : 'N/A';

    return `Crop Calendar:
- Crop: ${calendar.cropName || 'N/A'}
- Current Stage: ${calendar.currentStage || 'N/A'}
- Stages:
- ${stages}`;
  }

  formatDiseaseData(data) {
    if (!data || !data.prediction) return 'Unable to detect disease';

    const prediction = data.prediction;
    return `Disease Detection:
- Detected Disease: ${prediction.disease || 'No disease detected'}
- Confidence: ${(prediction.confidence * 100).toFixed(1)}%
- Severity: ${prediction.severity || 'N/A'}
- Recommendations: ${prediction.treatment || 'Consult agricultural expert'}`;
  }

  async executeMultipleTools(tools, token) {
    const results = [];

    for (const tool of tools) {
      try {
        const result = await this.executeTool(tool.name, tool.params, token);
        results.push(result);
      } catch (error) {
        logger.warn(`Tool execution failed for ${tool.name}`, error.message);
        results.push({
          success: false,
          tool: tool.name,
          error: error.message,
        });
      }
    }

    return results;
  }
}

module.exports = new ToolExecutor();
