/**
 * Database initialization script for disease detection service
 * Creates database and tables
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const CREATE_DATABASE_SQL = `
CREATE DATABASE IF NOT EXISTS terrasens_disease_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`;

const CREATE_DISEASE_ANALYSIS_TABLE = `
CREATE TABLE IF NOT EXISTS disease_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    analysis_id VARCHAR(36) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    parcel_id INT,
    image_url VARCHAR(255) NOT NULL,
    disease_name VARCHAR(100) NOT NULL,
    confidence DECIMAL(5, 4) NOT NULL,
    recommendation TEXT,
    treatment_type VARCHAR(50),
    raw_response LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_parcel_id (parcel_id),
    INDEX idx_analysis_id (analysis_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const CREATE_ANALYSIS_IMAGES_TABLE = `
CREATE TABLE IF NOT EXISTS analysis_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    analysis_id VARCHAR(36) NOT NULL,
    original_filename VARCHAR(255),
    file_size INT,
    mime_type VARCHAR(50),
    storage_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_analysis_id (analysis_id),
    FOREIGN KEY (analysis_id) REFERENCES disease_analysis(analysis_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function initializeDatabase() {
  let connection;
  try {
    console.log('🔧 Initializing disease detection database...\n');

    // Connect to MySQL without specifying a database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to MySQL server');

    // Create database
    console.log('📦 Creating database: terrasens_disease_db');
    await connection.execute(CREATE_DATABASE_SQL);
    console.log('✅ Database created successfully');

    // Close first connection and create new one to the specific database
    await connection.end();
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: 'terrasens_disease_db',
      port: process.env.DB_PORT || 3306
    });

    // Create disease_analysis table
    console.log('📋 Creating table: disease_analysis');
    await connection.execute(CREATE_DISEASE_ANALYSIS_TABLE);
    console.log('✅ disease_analysis table created successfully');

    // Create analysis_images table
    console.log('📸 Creating table: analysis_images');
    await connection.execute(CREATE_ANALYSIS_IMAGES_TABLE);
    console.log('✅ analysis_images table created successfully');

    console.log('\n✨ Database initialization completed successfully!\n');
    console.log('📊 Tables created:');
    console.log('   • disease_analysis');
    console.log('   • analysis_images');

    await connection.end();
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
