const Database = require('../config/database');

/**
 * AnalysisImageRepository
 * Handles metadata for uploaded disease analysis images
 */
class AnalysisImageRepository {
  /**
   * Create image metadata record
   * @param {string} analysisId - Analysis UUID
   * @param {Object} imageData - Image metadata
   * @returns {Promise<Object>}
   */
  static async create(analysisId, imageData) {
    const sql = `
      INSERT INTO analysis_images (
        analysis_id,
        original_filename,
        file_size,
        mime_type,
        storage_path
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      analysisId,
      imageData.originalFilename,
      imageData.fileSize || null,
      imageData.mimeType,
      imageData.storagePath
    ];

    try {
      await Database.query(sql, params);
      return { analysisId, ...imageData };
    } catch (error) {
      console.error('Error creating image metadata:', error);
      throw error;
    }
  }

  /**
   * Get image metadata by analysis ID
   * @param {string} analysisId - Analysis UUID
   * @returns {Promise<Object|null>}
   */
  static async findByAnalysisId(analysisId) {
    const sql = `
      SELECT * FROM analysis_images WHERE analysis_id = ?
    `;

    try {
      const results = await Database.query(sql, [analysisId]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error finding image metadata:', error);
      throw error;
    }
  }

  /**
   * Delete image metadata
   * @param {string} analysisId - Analysis UUID
   * @returns {Promise<boolean>}
   */
  static async delete(analysisId) {
    const sql = `DELETE FROM analysis_images WHERE analysis_id = ?`;

    try {
      const result = await Database.query(sql, [analysisId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting image metadata:', error);
      throw error;
    }
  }
}

module.exports = AnalysisImageRepository;
