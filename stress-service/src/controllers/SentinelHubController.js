const logger = require('../utils/logger');
const SentinelHubService = require('../services/SentinelHubService');
const CropCalendarClient = require('../services/CropCalendarClient');

class SentinelHubController {
  /**
   * GET /sentinel/image/:fieldId?imageType=NDVI&date=2024-01-15
   * Retrieve satellite image from Sentinel Hub for a field
   */
  getFieldImage = async (req, res) => {
    try {
      const { fieldId } = req.params;
      const { imageType = 'NDVI', date } = req.query;

      if (!fieldId) {
        return res.status(400).json({
          error: 'fieldId is required'
        });
      }

      logger.info('Requesting field image', {
        fieldId,
        imageType,
        date
      });

      // Fetch field/parcel data to get coordinates
      const fieldData = await CropCalendarClient.getParcelData(parseInt(fieldId));

      if (!fieldData || !fieldData.polygon) {
        return res.status(404).json({
          error: 'Field not found or has no geometry data'
        });
      }

      // Determine which image retrieval method to use
      let imageBuffer;
      let metadata = null;

      if (imageType === 'NDVI') {
        imageBuffer = await SentinelHubService.getNDVIVisualization(fieldData.polygon);
      } else if (imageType === 'TrueColor') {
        imageBuffer = await SentinelHubService.getTrueColorImage(fieldData.polygon);
      } else if (imageType === 'Moisture') {
        imageBuffer = await SentinelHubService.getMoistureImage(fieldData.polygon);
      } else {
        imageBuffer = await SentinelHubService.getNDVIVisualization(fieldData.polygon);
      }

      // Get metadata
      try {
        const response = await SentinelHubService.getImageWithMetadata(fieldData.polygon, imageType);
        metadata = response.metadata;
      } catch (error) {
        logger.warn('Failed to retrieve metadata', { message: error.message });
        metadata = {
          acquisitionDate: new Date().toISOString(),
          imageType: imageType
        };
      }

      // Add field information to response headers for frontend
      res.set({
        'Content-Type': 'image/png',
        'X-Field-Name': fieldData.name || '',
        'X-Field-Crop': fieldData.cropType || '',
        'X-Field-Area': fieldData.area || '',
        'X-Image-Type': imageType,
        'X-Acquisition-Date': metadata?.acquisitionDate || new Date().toISOString(),
        'X-Cloud-Coverage': metadata?.cloudCoverage || '0'
      });

      logger.info('Field image retrieved successfully', {
        fieldId,
        imageType,
        size: imageBuffer.length
      });

      res.send(imageBuffer);
    } catch (error) {
      logger.error('Failed to retrieve field image', {
        message: error.message,
        fieldId: req.params.fieldId
      });

      res.status(500).json({
        error: 'Failed to retrieve satellite image',
        message: error.message
      });
    }
  };

  /**
   * GET /sentinel/image/:fieldId/metadata
   * Get metadata about available satellite images for a field
   */
  getFieldImageMetadata = async (req, res) => {
    try {
      const { fieldId } = req.params;

      if (!fieldId) {
        return res.status(400).json({
          error: 'fieldId is required'
        });
      }

      logger.info('Retrieving field image metadata', { fieldId });

      // Fetch field data
      const fieldData = await CropCalendarClient.getParcelData(parseInt(fieldId));

      if (!fieldData || !fieldData.polygon) {
        return res.status(404).json({
          error: 'Field not found or has no geometry data'
        });
      }

      // Get metadata for available image types
      const metadata = {
        fieldId: fieldData.parcelId,
        fieldName: fieldData.name,
        cropType: fieldData.cropType,
        area: fieldData.area,
        polygon: fieldData.polygon,
        availableImageTypes: [
          {
            type: 'NDVI',
            description: 'Normalized Difference Vegetation Index',
            colorScale: {
              min: 'Red (unhealthy)',
              medium: 'Yellow (moderate)',
              max: 'Green (healthy)'
            }
          },
          {
            type: 'TrueColor',
            description: 'Natural RGB satellite image'
          },
          {
            type: 'Moisture',
            description: 'Soil moisture visualization (future)'
          }
        ],
        metadata: {
          resolution: '512x512',
          format: 'PNG',
          source: 'Sentinel-2 L2A',
          lastUpdated: new Date().toISOString()
        }
      };

      res.json({
        success: true,
        data: metadata
      });
    } catch (error) {
      logger.error('Failed to retrieve field image metadata', {
        message: error.message,
        fieldId: req.params.fieldId
      });

      res.status(500).json({
        error: 'Failed to retrieve metadata',
        message: error.message
      });
    }
  };

  /**
   * GET /sentinel/legend
   * Get NDVI color scale legend
   */
  getNDVILegend = async (req, res) => {
    try {
      const legend = {
        imageType: 'NDVI',
        title: 'NDVI Color Scale - Vegetation Health',
        scale: [
          {
            value: '< 0.2',
            color: '#FF0000',
            label: 'Unhealthy/Stressed',
            description: 'Very low vegetation health, severe stress'
          },
          {
            value: '0.2 - 0.35',
            color: '#FF6400',
            label: 'Poor',
            description: 'Low vegetation health, significant stress'
          },
          {
            value: '0.35 - 0.45',
            color: '#FFFF00',
            label: 'Moderate',
            description: 'Moderate vegetation health, some stress'
          },
          {
            value: '0.45 - 0.55',
            color: '#B4FF00',
            label: 'Good',
            description: 'Good vegetation health, minor stress'
          },
          {
            value: '> 0.55',
            color: '#00FF00',
            label: 'Excellent',
            description: 'Excellent vegetation health, no stress'
          }
        ],
        notes: 'NDVI ranges from -1 to 1. Values < 0.2 indicate vegetation stress.',
        dataSource: 'Sentinel-2 Satellite'
      };

      res.json(legend);
    } catch (error) {
      logger.error('Failed to retrieve NDVI legend', {
        message: error.message
      });

      res.status(500).json({
        error: 'Failed to retrieve legend',
        message: error.message
      });
    }
  };

  /**
   * POST /sentinel/download/:fieldId
   * Download satellite image with metadata
   */
  downloadFieldImage = async (req, res) => {
    try {
      const { fieldId } = req.params;
      const { imageType = 'NDVI' } = req.body;

      if (!fieldId) {
        return res.status(400).json({
          error: 'fieldId is required'
        });
      }

      logger.info('Downloading field image', {
        fieldId,
        imageType
      });

      // Fetch field data
      const fieldData = await CropCalendarClient.getParcelData(parseInt(fieldId));

      if (!fieldData || !fieldData.polygon) {
        return res.status(404).json({
          error: 'Field not found or has no geometry data'
        });
      }

      // Get image
      let imageBuffer;
      if (imageType === 'NDVI') {
        imageBuffer = await SentinelHubService.getNDVIVisualization(fieldData.polygon);
      } else if (imageType === 'TrueColor') {
        imageBuffer = await SentinelHubService.getTrueColorImage(fieldData.polygon);
      } else {
        imageBuffer = await SentinelHubService.getNDVIVisualization(fieldData.polygon);
      }

      // Set download headers
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${fieldData.name}_${imageType}_${timestamp}.png`;

      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Field-Name': fieldData.name || '',
        'X-Field-Crop': fieldData.cropType || '',
        'X-Image-Type': imageType,
        'X-Download-Date': new Date().toISOString()
      });

      logger.info('Field image downloaded', {
        fieldId,
        imageType,
        filename
      });

      res.send(imageBuffer);
    } catch (error) {
      logger.error('Failed to download field image', {
        message: error.message,
        fieldId: req.params.fieldId
      });

      res.status(500).json({
        error: 'Failed to download image',
        message: error.message
      });
    }
  };

  /**
   * GET /sentinel/field/:fieldId/info
   * Get comprehensive field information for sentinel image viewer
   */
  getFieldInfo = async (req, res) => {
    try {
      const { fieldId } = req.params;

      if (!fieldId) {
        return res.status(400).json({
          error: 'fieldId is required'
        });
      }

      logger.info('Retrieving field information', { fieldId });

      // Fetch field data
      const fieldData = await CropCalendarClient.getParcelData(parseInt(fieldId));

      if (!fieldData) {
        return res.status(404).json({
          error: 'Field not found'
        });
      }

      const fieldInfo = {
        id: fieldData.parcelId,
        name: fieldData.name,
        cropType: fieldData.cropType,
        area: fieldData.area,
        season: fieldData.season,
        polygon: fieldData.polygon,
        coordinates: fieldData.coordinates,
        farmerId: fieldData.farmerId,
        imageTypes: ['NDVI', 'TrueColor', 'Moisture'],
        status: 'active'
      };

      res.json({
        success: true,
        data: fieldInfo
      });
    } catch (error) {
      logger.error('Failed to retrieve field information', {
        message: error.message,
        fieldId: req.params.fieldId
      });

      res.status(500).json({
        error: 'Failed to retrieve field information',
        message: error.message
      });
    }
  };
}

module.exports = new SentinelHubController();
