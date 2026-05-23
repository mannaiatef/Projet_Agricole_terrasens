const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'terrasens_irrigation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});

/**
 * Initialize database schema
 */
async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    console.log('[DB] Creating database if not exists...');
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'terrasens_irrigation'}`
    );
    console.log('[DB] ✓ Database ready');
  } catch (error) {
    console.error('[DB] Error creating database:', error.message);
  } finally {
    await connection.end();
  }

  const dbConnection = await pool.getConnection();

  try {
    // Irrigation Records Table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS irrigation_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parcel_id INT NOT NULL,
        water_amount DECIMAL(10, 2) NOT NULL COMMENT 'Amount in mm',
        duration INT NOT NULL COMMENT 'Duration in minutes',
        priority ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
        recommended_time DATETIME,
        status ENUM('PENDING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
        weather_data JSON,
        stress_data JSON,
        crop_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_parcel_id (parcel_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Irrigation Records table verified');

    // Irrigation Schedule Table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS irrigation_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parcel_id INT NOT NULL,
        scheduled_time DATETIME NOT NULL,
        status ENUM('PENDING', 'EXECUTED', 'SKIPPED', 'CANCELLED') DEFAULT 'PENDING',
        water_amount DECIMAL(10, 2),
        duration INT COMMENT 'Duration in minutes',
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        executed_at DATETIME,
        INDEX idx_parcel_id (parcel_id),
        INDEX idx_scheduled_time (scheduled_time),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Irrigation Schedule table verified');

    // Irrigation History View (accumulated data)
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS irrigation_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parcel_id INT NOT NULL,
        total_water_applied DECIMAL(10, 2) DEFAULT 0,
        total_duration INT DEFAULT 0,
        irrigation_count INT DEFAULT 0,
        avg_priority VARCHAR(10),
        last_irrigation_date DATETIME,
        month_year VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_parcel_id (parcel_id),
        INDEX idx_month_year (month_year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Irrigation History table verified');

    // Irrigation Alerts Table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS irrigation_alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parcel_id INT NOT NULL,
        alert_type ENUM('HIGH_STRESS', 'LOW_NDVI', 'EXTREME_WEATHER', 'EQUIPMENT_FAILURE') NOT NULL,
        message VARCHAR(255),
        severity ENUM('INFO', 'WARNING', 'CRITICAL') DEFAULT 'WARNING',
        status ENUM('OPEN', 'ACKNOWLEDGED', 'RESOLVED') DEFAULT 'OPEN',
        acknowledged_at DATETIME,
        resolved_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_parcel_id (parcel_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Irrigation Alerts table verified');

    // Irrigation Recommendations Table - Store detailed recommendations
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS irrigation_recommendations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parcel_id INT NOT NULL,
        parcel_name VARCHAR(255),
        crop_name VARCHAR(255),
        area_hectares DECIMAL(8, 2),
        water_amount_mm DECIMAL(10, 2) NOT NULL COMMENT 'Water amount in mm',
        water_volume_m3 DECIMAL(12, 2) NOT NULL COMMENT 'Water volume in cubic meters',
        duration_minutes INT NOT NULL COMMENT 'Irrigaton duration in minutes',
        priority ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
        recommended_time TIME,
        decision_reason TEXT,
        et0 DECIMAL(10, 4) COMMENT 'Reference evapotranspiration',
        kc DECIMAL(5, 3) COMMENT 'Crop coefficient',
        etc DECIMAL(10, 4) COMMENT 'Crop evapotranspiration',
        base_water_amount DECIMAL(10, 2),
        stress_adjustment DECIMAL(5, 3),
        humidity_adjustment DECIMAL(5, 3),
        stress_percentage DECIMAL(5, 2),
        stress_score INT,
        ndvi DECIMAL(5, 3),
        temperature DECIMAL(5, 2),
        humidity INT,
        rain_forecast_24h DECIMAL(10, 2),
        weather_description VARCHAR(255),
        parcel_latitude DECIMAL(10, 8),
        parcel_longitude DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_parcel_id (parcel_id),
        INDEX idx_created_at (created_at),
        INDEX idx_priority (priority)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Irrigation Recommendations table verified');
  } catch (error) {
    console.error('[DB] Error initializing tables:', error.message);
    throw error;
  } finally {
    dbConnection.release();
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('[DB] Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[DB] Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { pool, initializeDatabase };
