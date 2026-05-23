const { pool } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function createTables() {
  try {
    const connection = await pool.getConnection();

    // Create stress_records table
    await connection.execute(`
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

    // Create stress_zones table
    await connection.execute(`
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

    // Create alerts table
    await connection.execute(`
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

    logger.info('Database tables created successfully');
    connection.release();
  } catch (error) {
    logger.error('Failed to create tables', { message: error.message });
    throw error;
  }
}

async function runMigrations() {
  try {
    await createTables();
    logger.info('All migrations completed');
  } catch (error) {
    logger.error('Migration failed', { message: error.message });
    process.exit(1);
  }
}

if (require.main === module) {
  require('dotenv').config();
  runMigrations();
}

module.exports = { runMigrations, createTables };
