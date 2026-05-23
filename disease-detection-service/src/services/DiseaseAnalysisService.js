const MockDiseaseService = require('../utils/MockDiseaseService');
const RecommendationEngine = require('../utils/RecommendationEngine');
const ImageUploadHelper = require('../utils/ImageUploadHelper');
const DiseaseAnalysisRepository = require('../repositories/DiseaseAnalysisRepository');
const AnalysisImageRepository = require('../repositories/AnalysisImageRepository');
const path = require('path');

/**
 * DiseaseAnalysisService
 * Orchestrates the disease detection workflow
 */
class DiseaseAnalysisService {
  constructor() {
    // Using MockDiseaseService for development/testing
    // Replace with PlantNetService or HuggingFaceService when real API is ready
    this.diseaseService = new MockDiseaseService();
    this.uploadDir = path.join(process.cwd(), 'uploads', 'diseases');
  }

  /**
   * Process image upload and perform disease analysis
   * @param {number} userId - User ID
   * @param {Object} file - Uploaded file object from multer
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeImage(userId, file, options = {}) {
    try {
      // Step 1: Validate file
      const fileValidation = ImageUploadHelper.validateFileType(file.mimetype);
      if (!fileValidation.valid) {
        const error = new Error(fileValidation.error);
        error.statusCode = 400;
        throw error;
      }

      const sizeValidation = ImageUploadHelper.validateFileSize(file.size);
      if (!sizeValidation.valid) {
        const error = new Error(sizeValidation.error);
        error.statusCode = 413;
        throw error;
      }

      // Step 2: Basic buffer validation
      if (!file.buffer || file.buffer.length === 0) {
        const error = new Error('Invalid image buffer');
        error.statusCode = 400;
        throw error;
      }

      // Step 3: Send to disease detection service for analysis
      console.log('🔍 Analyzing image for disease detection...');
      const aiResult = await this.diseaseService.analyzeImage(file.buffer);

      // Step 4: Generate recommendation based on disease
      const recommendation = RecommendationEngine.generateRecommendation(
        aiResult.disease,
        aiResult.confidence
      );

      // Step 5: Save image file to disk
      const filename = ImageUploadHelper.generateFilename(file.originalname);
      const fileInfo = ImageUploadHelper.saveImage(
        file.buffer,
        this.uploadDir,
        filename
      );

      // Step 6: Store analysis in database
      const analysisData = {
        parcelId: options.parcelId || null,
        imageUrl: fileInfo.fileUrl,
        diseaseName: aiResult.disease,
        confidence: aiResult.confidence,
        recommendation: recommendation.recommendation,
        treatmentType: recommendation.treatmentType,
        rawResponse: JSON.stringify(aiResult.allSuggestions || aiResult)
      };

      const analysis = await DiseaseAnalysisRepository.create(userId, analysisData);

      // Step 7: Store image metadata
      await AnalysisImageRepository.create(analysis.analysisId, {
        originalFilename: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storagePath: fileInfo.fileUrl
      });

      // Return enriched response matching frontend DiseaseAnalysis interface
      return {
        success: true,
        id: analysis.analysisId,
        analysisId: analysis.analysisId,
        userId: userId,
        parcelId: options.parcelId || null,
        imageUrl: fileInfo.fileUrl,
        detectedDiseases: [
          {
            name: aiResult.disease,
            confidence: aiResult.confidence,
            severity: aiResult.confidence >= 0.9 ? 'critical' : aiResult.confidence >= 0.75 ? 'high' : aiResult.confidence >= 0.5 ? 'medium' : 'low',
            affectedArea: 65 // Mock value - would come from image analysis
          }
        ],
        recommendations: {
          pesticide: recommendation.recommendation,
          organic: 'Use integrated pest management methods',
          preventive: 'Implement crop rotation and sanitation practices'
        },
        analysisDate: new Date().toISOString(),
        status: 'completed'
      };
    } catch (error) {
      // Cleanup on error
      if (file && file.buffer) {
        // Don't save file if analysis fails
      }
      throw error;
    }
  }

  /**
   * Get analysis history for user
   * @param {number} userId - User ID
   * @param {number} limit - Number of records to return
   * @param {number} offset - Pagination offset
   * @returns {Promise<Object>} History data with pagination
   */
  async getAnalysisHistory(userId, limit = 10, offset = 0) {
    try {
      const result = await DiseaseAnalysisRepository.findByUserId(userId, limit, offset);

      // Transform response to match frontend expectations
      const analyses = result.data.map(analysis => ({
        id: analysis.analysisId,
        imageUrl: analysis.imageUrl,
        mainDisease: analysis.diseaseName,
        confidence: analysis.confidence,
        analysisDate: analysis.createdAt,
        parcelId: analysis.parcelId
      }));

      return {
        analyses: analyses || [],
        total: result.total || 0,
        pages: Math.ceil((result.total || 0) / limit)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single analysis by ID
   * @param {string} analysisId - Analysis UUID
   * @returns {Promise<Object>} Analysis details
   */
  async getAnalysis(analysisId) {
    try {
      const analysis = await DiseaseAnalysisRepository.findById(analysisId);

      if (!analysis) {
        const error = new Error('Analysis not found');
        error.statusCode = 404;
        throw error;
      }

      // Get image metadata
      const imageMetadata = await AnalysisImageRepository.findByAnalysisId(analysisId);

      // Return enriched response matching frontend DiseaseAnalysis interface
      return {
        success: true,
        data: {
          id: analysis.analysisId,
          analysisId: analysis.analysisId,
          userId: analysis.userId,
          parcelId: analysis.parcelId,
          imageUrl: analysis.imageUrl,
          detectedDiseases: [
            {
              name: analysis.diseaseName,
              confidence: analysis.confidence,
              severity: analysis.confidence >= 0.9 ? 'critical' : analysis.confidence >= 0.75 ? 'high' : analysis.confidence >= 0.5 ? 'medium' : 'low',
              affectedArea: 65 // Mock value - would come from image analysis
            }
          ],
          recommendations: {
            pesticide: analysis.recommendation || 'Consult with agricultural specialist',
            organic: 'Use integrated pest management methods',
            preventive: 'Implement crop rotation and sanitation practices'
          },
          analysisDate: analysis.createdAt,
          status: 'completed',
          imageMetadata
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get analyses for a specific parcel
   * @param {number} parcelId - Parcel ID
   * @param {number} limit - Number of records
   * @param {number} offset - Pagination offset
   * @returns {Promise<Object>} Parcel analyses
   */
  async getParcelAnalyses(parcelId, limit = 10, offset = 0) {
    try {
      const data = await DiseaseAnalysisRepository.findByParcelId(parcelId, limit, offset);

      return {
        success: true,
        data,
        pagination: {
          limit,
          offset
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get disease statistics for user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Disease frequency statistics
   */
  async getDiseaseStatistics(userId) {
    try {
      const stats = await DiseaseAnalysisRepository.getDiseaseStatistics(userId);

      // Calculate totals
      const totalAnalyses = stats.reduce((sum, s) => sum + s.count, 0);

      // Transform to frontend format - get top 10 diseases
      const commonDiseases = stats.slice(0, 10).map(stat => ({
        name: stat.name,
        count: stat.count,
        percentage: totalAnalyses > 0 ? Number(((stat.count / totalAnalyses) * 100).toFixed(1)) : 0
      }));

      // Mock severity distribution (in real scenario, this would be calculated from actual data)
      const severityDistribution = {
        low: Math.floor(totalAnalyses * 0.2),
        medium: Math.floor(totalAnalyses * 0.4),
        high: Math.floor(totalAnalyses * 0.3),
        critical: Math.floor(totalAnalyses * 0.1)
      };

      return {
        totalAnalyses: totalAnalyses || 0,
        successfulAnalyses: totalAnalyses || 0,
        failedAnalyses: 0,
        commonDiseases: commonDiseases || [],
        severityDistribution: severityDistribution
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get high-confidence disease detections (potential issues)
   * @param {number} userId - User ID
   * @param {number} minConfidence - Minimum confidence threshold
   * @returns {Promise<Object>} High-confidence analyses
   */
  async getHighConfidenceAnalyses(userId, minConfidence = 80) {
    try {
      const data = await DiseaseAnalysisRepository.getHighConfidenceAnalyses(
        userId,
        minConfidence
      );

      // Transform to match frontend DiseaseAnalysis interface
      const highRiskAnalyses = data.map(analysis => ({
        id: analysis.analysisId,
        userId: analysis.userId,
        parcelId: analysis.parcelId,
        imageUrl: analysis.imageUrl,
        detectedDiseases: [
          {
            name: analysis.diseaseName,
            confidence: analysis.confidence,
            severity: analysis.confidence >= 90 ? 'critical' : analysis.confidence >= 75 ? 'high' : 'medium',
            affectedArea: 65 // Mock value - would come from image analysis in real implementation
          }
        ],
        recommendations: {
          pesticide: analysis.recommendation || 'Consult with agricultural specialist',
          organic: 'Use organic integrated pest management methods',
          preventive: 'Implement crop rotation and sanitation practices'
        },
        analysisDate: analysis.createdAt,
        status: 'completed',
        severity: analysis.confidence >= 90 ? 'critical' : analysis.confidence >= 75 ? 'high' : 'medium'
      }));

      return {
        highRiskAnalyses: highRiskAnalyses || [],
        count: highRiskAnalyses.length
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete analysis and associated image
   * @param {string} analysisId - Analysis UUID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAnalysis(analysisId, userId) {
    try {
      // Verify ownership
      const analysis = await DiseaseAnalysisRepository.findById(analysisId);
      
      if (!analysis) {
        const error = new Error('Analysis not found');
        error.statusCode = 404;
        throw error;
      }

      if (analysis.userId !== userId) {
        const error = new Error('Unauthorized: Cannot delete other user\'s analysis');
        error.statusCode = 403;
        throw error;
      }

      // Delete image file
      const imageMetadata = await AnalysisImageRepository.findByAnalysisId(analysisId);
      if (imageMetadata) {
        const filePath = path.join(process.cwd(), imageMetadata.storage_path);
        ImageUploadHelper.deleteImage(filePath);
      }

      // Delete metadata
      await AnalysisImageRepository.delete(analysisId);

      // Delete analysis record
      const deleted = await DiseaseAnalysisRepository.delete(analysisId);

      return {
        success: true,
        message: 'Analysis deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DiseaseAnalysisService;
