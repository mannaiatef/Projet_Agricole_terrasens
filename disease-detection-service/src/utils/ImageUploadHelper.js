const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * ImageUploadHelper
 * Handles image file operations and storage
 */
class ImageUploadHelper {
  /**
   * Create upload directory if it doesn't exist
   * @static
   * @param {string} uploadDir - Base upload directory
   * @returns {void}
   */
  static ensureUploadDir(uploadDir) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  /**
   * Generate unique filename for uploaded image
   * @static
   * @param {string} originalFilename - Original file name from upload
   * @returns {string} Generated unique filename
   */
  static generateFilename(originalFilename) {
    const ext = path.extname(originalFilename);
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    return `disease-${timestamp}-${uuid}${ext}`;
  }

  /**
   * Save uploaded image to disk
   * @static
   * @param {Buffer} fileBuffer - File buffer from multipart upload
   * @param {string} uploadDir - Directory to save file
   * @param {string} filename - Filename to use
   * @returns {Object} File save result {filePath: string, fileUrl: string}
   */
  static saveImage(fileBuffer, uploadDir, filename) {
    try {
      this.ensureUploadDir(uploadDir);
      
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, fileBuffer);

      // Return absolute path for correct frontend resolution
      const fileUrl = `/uploads/diseases/${filename}`;

      return {
        filePath,
        fileUrl,
        filename
      };
    } catch (error) {
      throw new Error(`Failed to save image: ${error.message}`);
    }
  }

  /**
   * Delete image file from disk
   * @static
   * @param {string} filePath - Full file path to delete
   * @returns {boolean} Success status
   */
  static deleteImage(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to delete image: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate file type
   * @static
   * @param {string} mimeType - MIME type from upload
   * @param {Array<string>} allowedTypes - Allowed MIME types
   * @returns {Object} Validation result {valid: boolean, error?: string}
   */
  static validateFileType(mimeType, allowedTypes = ['image/jpeg', 'image/png']) {
    if (!mimeType) {
      return { valid: false, error: 'MIME type not provided' };
    }

    if (!allowedTypes.includes(mimeType)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
      };
    }

    return { valid: true };
  }

  /**
   * Validate file size
   * @static
   * @param {number} fileSize - File size in bytes
   * @param {number} maxSize - Maximum allowed size in bytes (default 5MB)
   * @returns {Object} Validation result {valid: boolean, error?: string}
   */
  static validateFileSize(fileSize, maxSize = 5242880) {
    if (!fileSize || fileSize === 0) {
      return { valid: false, error: 'File is empty' };
    }

    if (fileSize > maxSize) {
      const maxMb = (maxSize / 1024 / 1024).toFixed(1);
      return { 
        valid: false, 
        error: `File size exceeds maximum of ${maxMb}MB` 
      };
    }

    return { valid: true };
  }
}

module.exports = ImageUploadHelper;
