const Database = require('./database');

/**
 * Database migration class
 * Create and manage database schema
 */
class Migration {
  /**
   * Create disease_analysis table
   * @returns {Promise<void>}
   */
  static async createDiseaseAnalysisTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS disease_analysis (
        id INT PRIMARY KEY AUTO_INCREMENT,
        analysis_id VARCHAR(36) UNIQUE NOT NULL COMMENT 'UUID for tracking',
        user_id INT NOT NULL COMMENT 'User who uploaded the image',
        parcel_id INT COMMENT 'Associated parcel/field',
        image_url VARCHAR(255) NOT NULL COMMENT 'Path to uploaded image',
        disease_name VARCHAR(255) NOT NULL COMMENT 'Detected disease',
        confidence INT NOT NULL COMMENT 'Confidence percentage (0-100)',
        recommendation TEXT NOT NULL COMMENT 'Treatment recommendation',
        treatment_type VARCHAR(50) COMMENT 'Type of treatment (fungicide, drainage, etc)',
        raw_response LONGTEXT COMMENT 'Raw AI API response',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parcel_id) REFERENCES parcelles(id) ON DELETE SET NULL,
        
        INDEX idx_user_id (user_id),
        INDEX idx_parcel_id (parcel_id),
        INDEX idx_created_at (created_at),
        INDEX idx_disease_name (disease_name),
        
        CONSTRAINT ck_confidence CHECK (confidence >= 0 AND confidence <= 100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Stores crop disease detection analysis results'
    `;

    try {
      await Database.query(sql);
      console.log('✅ disease_analysis table created/verified');
    } catch (error) {
      console.error('❌ Error creating disease_analysis table:', error.message);
      throw error;
    }
  }

  /**
   * Create analysis_images table for storing additional image metadata
   * @returns {Promise<void>}
   */
  static async createAnalysisImagesTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS analysis_images (
        id INT PRIMARY KEY AUTO_INCREMENT,
        analysis_id VARCHAR(36) NOT NULL COMMENT 'Link to disease_analysis',
        original_filename VARCHAR(255) NOT NULL,
        file_size INT COMMENT 'File size in bytes',
        mime_type VARCHAR(50),
        storage_path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (analysis_id) REFERENCES disease_analysis(analysis_id) ON DELETE CASCADE,
        
        INDEX idx_analysis_id (analysis_id),
        UNIQUE KEY uk_analysis_image (analysis_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Metadata for uploaded disease analysis images'
    `;

    try {
      await Database.query(sql);
      console.log('✅ analysis_images table created/verified');
    } catch (error) {
      console.error('❌ Error creating analysis_images table:', error.message);
      throw error;
    }
  }

  /**
   * Create disease_notifications table for bonus feature
   * @returns {Promise<void>}
   */
  static async createDiseaseNotificationsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS disease_notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        analysis_id VARCHAR(36),
        disease_name VARCHAR(255) NOT NULL,
        urgency_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        is_sent BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (analysis_id) REFERENCES disease_analysis(analysis_id) ON DELETE CASCADE,
        
        INDEX idx_user_id (user_id),
        INDEX idx_is_sent (is_sent),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Notifications for detected diseases'
    `;

    try {
      await Database.query(sql);
      console.log('✅ disease_notifications table created/verified');
    } catch (error) {
      console.error('❌ Error creating disease_notifications table:', error.message);
      throw error;
    }
  }

  /**
   * Run all migrations
   * @returns {Promise<void>}
   */
  static async up() {
    console.log('🚀 Running migrations...');
    
    try {
      await Database.initialize();
      await Migration.createDiseaseAnalysisTable();
      await Migration.createAnalysisImagesTable();
      await Migration.createDiseaseNotificationsTable();
      
      console.log('✅ All migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }
}

module.exports = Migration;
