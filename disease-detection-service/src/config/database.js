const mysql = require('mysql2/promise');

/**
 * Create connection pool for database operations
 */
class Database {
  static pool = null;

  /**
   * Initialize database connection pool
   * @returns {Promise<void>}
   */
  static async initialize() {
    if (Database.pool) return;

    Database.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'terrasens_disease_db',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0
    });

    console.log('✅ Database connection pool initialized');
  }

  /**
   * Get database connection from pool
   * @returns {Promise<Connection>}
   */
  static async getConnection() {
    if (!Database.pool) {
      await Database.initialize();
    }
    return Database.pool.getConnection();
  }

  /**
   * Execute query and return results
   * @param {string} sql - SQL query to execute
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>}
   */
  static async query(sql, params = []) {
    const connection = await Database.getConnection();
    try {
      const [results] = await connection.execute(sql, params);
      return results;
    } finally {
      connection.release();
    }
  }

  /**
   * Execute multiple queries in a transaction
   * @param {Function} callback - Callback function executing queries
   * @returns {Promise<any>}
   */
  static async transaction(callback) {
    const connection = await Database.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Close the connection pool
   * @returns {Promise<void>}
   */
  static async close() {
    if (Database.pool) {
      await Database.pool.end();
      Database.pool = null;
      console.log('✅ Database connection pool closed');
    }
  }
}

module.exports = Database;
