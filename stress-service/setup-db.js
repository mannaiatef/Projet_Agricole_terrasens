/**
 * Database Setup Script for Stress Service
 * Creates the database and tables needed for the stress service to function
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();
const logger = require('./src/utils/logger');

async function setupDatabase() {
  let connection;
  
  try {
    // First, connect without a database to create the database
    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 3306
    });

    const dbName = process.env.DB_NAME || 'stress_service_db';
    
    // Create database if it doesn't exist (use query, not execute, to avoid prepared statement issues)
    console.log(`Creating database '${dbName}' if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✓ Database '${dbName}' ready`);

    // Select the database
    await connection.query(`USE ${dbName}`);
    console.log(`✓ Database selected`);

    // Create stress_records table
    console.log('Creating stress_records table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stress_records (
        id INT PRIMARY KEY AUTO_INCREMENT,
        parcel_id INT NOT NULL,
        mean_ndvi DECIMAL(5, 4),
        stress_percentage DECIMAL(5, 2),
        pixel_count INT,
        stressed_pixel_count INT,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        error_message TEXT,
        imagery_date DATE,
        cloud_coverage DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_parcel_id (parcel_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ stress_records table created');

    // Create stress_zones table
    console.log('Creating stress_zones table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stress_zones (
        id INT PRIMARY KEY AUTO_INCREMENT,
        record_id INT NOT NULL,
        geojson JSON NOT NULL,
        stress_level ENUM('high', 'medium', 'healthy'),
        zone_area DECIMAL(15, 6),
        pixel_count INT,
        mean_ndvi_in_zone DECIMAL(5, 4),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (record_id) REFERENCES stress_records(id) ON DELETE CASCADE,
        INDEX idx_record_id (record_id),
        INDEX idx_stress_level (stress_level)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ stress_zones table created');

    // Create alerts table
    console.log('Creating stress_alerts table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stress_alerts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        record_id INT NOT NULL,
        parcel_id INT NOT NULL,
        alert_type VARCHAR(50),
        severity ENUM('low', 'medium', 'high'),
        message TEXT,
        is_resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        FOREIGN KEY (record_id) REFERENCES stress_records(id) ON DELETE CASCADE,
        INDEX idx_parcel_id (parcel_id),
        INDEX idx_is_resolved (is_resolved)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ stress_alerts table created');

    console.log('\n✅ Database setup completed successfully!');
    console.log(`\nDatabase: ${dbName}`);
    console.log('Host: ' + (process.env.DB_HOST || 'localhost'));
    console.log('Port: ' + (process.env.DB_PORT || 3306));
    console.log('User: ' + (process.env.DB_USER || 'root'));

  } catch (error) {
    console.error('❌ Database setup failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('\n⚠️  Cannot connect to MySQL server.');
      console.error('Make sure MySQL is running!');
      console.error('Start MySQL with: mysql -u root -p');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n⚠️  Access denied. Check DB_USER and DB_PASSWORD in .env');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
