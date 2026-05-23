const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

let sequelize;

const initializeDatabase = async () => {
  try {
    // First, create the database if it doesn't exist
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      port: process.env.DB_PORT || 3306,
    });

    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'terrasens_chatbot'}`
    );
    await connection.end();

    // Initialize Sequelize
    sequelize = new Sequelize(
      process.env.DB_NAME || 'terrasens_chatbot',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || 'root',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );

    // Test the connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Load and initialize models
    const { initializeConversationModel } = require('../models/Conversation');
    initializeConversationModel();
    console.log('✓ Conversation model initialized');

    // Sync models with force: false to preserve data
    await sequelize.sync({ alter: false });
    console.log('✓ Database models synchronized');

    return sequelize;
  } catch (error) {
    console.error('✗ Database initialization error:', error.message);
    throw error;
  }
};

const getDatabase = () => sequelize;

module.exports = {
  initializeDatabase,
  getDatabase,
};
