const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Initialize database and create tables if they don't exist
 */
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();

    // Create parcelles table with geospatial support
    await connection.query(`
      CREATE TABLE IF NOT EXISTS parcelles (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        latitude DOUBLE NOT NULL,
        longitude DOUBLE NOT NULL,
        polygon JSON NOT NULL,
        surface DECIMAL(10, 2),
        lang VARCHAR(20),
        crop_id INT,
        sowing_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_crop_id (crop_id)
      )
    `);
    console.log('✓ Parcelles table verified');

    // Add new geospatial columns to existing parcelles table if they don't exist
    // (for backward compatibility with existing databases)
    try {
      await connection.query(
        `ALTER TABLE parcelles 
         ADD COLUMN IF NOT EXISTS latitude DOUBLE NOT NULL DEFAULT 0`
      );
      console.log('✓ Latitude column added to parcelles');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE parcelles 
         ADD COLUMN IF NOT EXISTS longitude DOUBLE NOT NULL DEFAULT 0`
      );
      console.log('✓ Longitude column added to parcelles');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE parcelles 
         ADD COLUMN IF NOT EXISTS polygon JSON`
      );
      console.log('✓ Polygon column added to parcelles');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE parcelles 
         ADD COLUMN IF NOT EXISTS soil_type VARCHAR(100)`
      );
      console.log('✓ Soil_type column added to parcelles');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE parcelles 
         ADD COLUMN IF NOT EXISTS lang VARCHAR(20)`
      );
      console.log('✓ Language column added to parcelles');
    } catch (e) {
      // Column might already exist
    }

    // Create crops table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS crops (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        duration_days INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Crops table verified');

    // Create stages table with fertilization and alerts
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stages (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        crop_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        stage_order INT NOT NULL,
        duration_days INT NOT NULL,
        kc_value DECIMAL(3, 2) NOT NULL DEFAULT 1.0,
        color VARCHAR(7),
        description TEXT,
        actions JSON,
        fertilization JSON,
        alerts JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
        UNIQUE KEY unique_crop_stage (crop_id, stage_order)
      )
    `);
    console.log('✓ Stages table verified');

    // Create actions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS actions (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        stage_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        how_to TEXT,
        frequency VARCHAR(50),
        priority VARCHAR(20) DEFAULT 'medium',
        alert_message VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Actions table verified');

    // Create calendars table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS calendars (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        parcelle_id INT NOT NULL,
        crop_id INT NOT NULL,
        sowing_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Calendars table verified');

    // Create calendar_stages table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS calendar_stages (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        calendar_id INT NOT NULL,
        stage_id INT NOT NULL,
        stage_number INT,
        stage_name VARCHAR(255),
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        duration_days INT,
        kc_value DECIMAL(3, 2),
        color VARCHAR(7),
        actions JSON,
        alerts JSON,
        fertilization JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
        FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Calendar_stages table verified');

    // Add missing columns to stages table if they don't exist
    // (for backward compatibility with existing databases)
    try {
      await connection.query(
        `ALTER TABLE stages 
         ADD COLUMN IF NOT EXISTS color VARCHAR(7)`
      );
      console.log('✓ Color column added to stages');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE stages 
         ADD COLUMN IF NOT EXISTS description TEXT`
      );
      console.log('✓ Description column added to stages');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE stages 
         ADD COLUMN IF NOT EXISTS actions JSON`
      );
      console.log('✓ Actions column added to stages');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE stages 
         ADD COLUMN IF NOT EXISTS fertilization JSON`
      );
      console.log('✓ Fertilization column added to stages');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE stages 
         ADD COLUMN IF NOT EXISTS alerts JSON`
      );
      console.log('✓ Alerts column added to stages');
    } catch (e) {
      // Column might already exist
    }

    // Add missing columns to calendar_stages if they don't exist
    // (for backward compatibility with existing databases)
    try {
      await connection.query(
        `ALTER TABLE calendar_stages 
         ADD COLUMN IF NOT EXISTS stage_name VARCHAR(255)`
      );
      console.log('✓ Stage_name column added to calendar_stages');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE calendar_stages 
         ADD COLUMN IF NOT EXISTS duration_days INT`
      );
      console.log('✓ Duration_days column added to calendar_stages');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE calendar_stages 
         ADD COLUMN IF NOT EXISTS kc_value DECIMAL(3, 2)`
      );
      console.log('✓ Kc_value column added to calendar_stages');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE calendar_stages 
         ADD COLUMN IF NOT EXISTS color VARCHAR(7)`
      );
      console.log('✓ Color column added to calendar_stages');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE calendar_stages 
         ADD COLUMN IF NOT EXISTS description TEXT`
      );
      console.log('✓ Description column added to calendar_stages');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE calendar_stages 
         ADD COLUMN IF NOT EXISTS actions JSON`
      );
      console.log('✓ Actions column added to calendar_stages');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE calendar_stages 
         ADD COLUMN IF NOT EXISTS alerts JSON`
      );
      console.log('✓ Alerts column added to calendar_stages');
    } catch (e) {
      // Column might already exist
    }

    try {
      await connection.query(
        `ALTER TABLE calendar_stages 
         ADD COLUMN IF NOT EXISTS fertilization JSON`
      );
      console.log('✓ Fertilization column added to calendar_stages');
    } catch (e) {
      // Column might already exist
    }

    connection.release();
    console.log('✓ Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase,
};
