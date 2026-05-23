const Database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * DiseaseAnalysisRepository
 * Handles all database operations for disease analysis records
 */
class DiseaseAnalysisRepository {
  /**
   * Create a new disease analysis record
   * @param {number} userId - User ID
   * @param {Object} analysisData - Analysis data
   * @returns {Promise<Object>}
   */
  static async create(userId, analysisData) {
    const analysisId = uuidv4();
    const sql = `
      INSERT INTO disease_analysis (
        analysis_id,
        user_id,
        parcel_id,
        image_url,
        disease_name,
        confidence,
        recommendation,
        treatment_type,
        raw_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      analysisId,
      userId,
      analysisData.parcelId || null,
      analysisData.imageUrl,
      analysisData.diseaseName,
      analysisData.confidence,
      analysisData.recommendation,
      analysisData.treatmentType || null,
      analysisData.rawResponse || null
    ];

    try {
      await Database.query(sql, params);
      return { analysisId, ...analysisData };
    } catch (error) {
      console.error('Error creating disease analysis:', error);
      throw error;
    }
  }

  /**
   * Get analysis by ID
   * @param {string} analysisId - Analysis UUID
   * @returns {Promise<Object|null>}
   */
  static async findById(analysisId) {
    const sql = `
      SELECT 
        id,
        analysis_id as analysisId,
        user_id as userId,
        parcel_id as parcelId,
        image_url as imageUrl,
        disease_name as diseaseName,
        confidence,
        recommendation,
        treatment_type as treatmentType,
        created_at as createdAt,
        updated_at as updatedAt
      FROM disease_analysis
      WHERE analysis_id = ?
    `;

    try {
      const results = await Database.query(sql, [analysisId]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error finding disease analysis:', error);
      throw error;
    }
  }

  /**
   * Get all analyses for a user with pagination
   * @param {number} userId - User ID
   * @param {number} limit - Number of records
   * @param {number} offset - Offset for pagination
   * @returns {Promise<{data: Array, total: number}>}
   */
  static async findByUserId(userId, limit = 10, offset = 0) {
    const sql = `
      SELECT 
        id,
        analysis_id as analysisId,
        user_id as userId,
        parcel_id as parcelId,
        image_url as imageUrl,
        disease_name as diseaseName,
        confidence,
        recommendation,
        treatment_type as treatmentType,
        created_at as createdAt,
        updated_at as updatedAt
      FROM disease_analysis
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) as total FROM disease_analysis WHERE user_id = ?
    `;

    try {
      const [data, countResult] = await Promise.all([
        Database.query(sql, [userId, limit, offset]),
        Database.query(countSql, [userId])
      ]);

      return {
        data,
        total: countResult[0]?.total || 0
      };
    } catch (error) {
      console.error('Error finding analyses by user:', error);
      throw error;
    }
  }

  /**
   * Get analyses for a specific parcel
   * @param {number} parcelId - Parcel ID
   * @param {number} limit - Number of records
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>}
   */
  static async findByParcelId(parcelId, limit = 10, offset = 0) {
    const sql = `
      SELECT 
        id,
        analysis_id as analysisId,
        user_id as userId,
        parcel_id as parcelId,
        image_url as imageUrl,
        disease_name as diseaseName,
        confidence,
        recommendation,
        treatment_type as treatmentType,
        created_at as createdAt
      FROM disease_analysis
      WHERE parcel_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    try {
      return await Database.query(sql, [parcelId, limit, offset]);
    } catch (error) {
      console.error('Error finding analyses by parcel:', error);
      throw error;
    }
  }

  /**
   * Update analysis record
   * @param {string} analysisId - Analysis UUID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>}
   */
  static async update(analysisId, updateData) {
    const sql = `
      UPDATE disease_analysis
      SET ${Object.keys(updateData).map(key => {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        return `${dbKey} = ?`;
      }).join(', ')}
      WHERE analysis_id = ?
    `;

    const values = [...Object.values(updateData), analysisId];

    try {
      await Database.query(sql, values);
      return await DiseaseAnalysisRepository.findById(analysisId);
    } catch (error) {
      console.error('Error updating disease analysis:', error);
      throw error;
    }
  }

  /**
   * Delete analysis record
   * @param {string} analysisId - Analysis UUID
   * @returns {Promise<boolean>}
   */
  static async delete(analysisId) {
    const sql = `DELETE FROM disease_analysis WHERE analysis_id = ?`;

    try {
      const result = await Database.query(sql, [analysisId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting disease analysis:', error);
      throw error;
    }
  }

  /**
   * Get statistics for a user (disease frequency)
   * @param {number} userId - User ID
   * @returns {Promise<Array>}
   */
  static async getDiseaseStatistics(userId) {
    const sql = `
      SELECT 
        disease_name as diseaseName,
        COUNT(*) as count,
        AVG(confidence) as avgConfidence
      FROM disease_analysis
      WHERE user_id = ?
      GROUP BY disease_name
      ORDER BY count DESC
    `;

    try {
      return await Database.query(sql, [userId]);
    } catch (error) {
      console.error('Error getting disease statistics:', error);
      throw error;
    }
  }

  /**
   * Get high-confidence analyses (potential issues)
   * @param {number} userId - User ID
   * @param {number} minConfidence - Minimum confidence threshold (default 80)
   * @returns {Promise<Array>}
   */
  static async getHighConfidenceAnalyses(userId, minConfidence = 80) {
    const sql = `
      SELECT 
        analysis_id as analysisId,
        disease_name as diseaseName,
        confidence,
        created_at as createdAt,
        parcel_id as parcelId
      FROM disease_analysis
      WHERE user_id = ? AND confidence >= ?
      ORDER BY created_at DESC
    `;

    try {
      return await Database.query(sql, [userId, minConfidence]);
    } catch (error) {
      console.error('Error getting high-confidence analyses:', error);
      throw error;
    }
  }
}

module.exports = DiseaseAnalysisRepository;
