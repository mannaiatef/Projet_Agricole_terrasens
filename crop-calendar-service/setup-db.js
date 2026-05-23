const mysql = require('mysql2/promise');
require('dotenv').config();

const createDatabase = async () => {
  try {
    // Connect without specifying a database first
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log('✓ Connected to MySQL');

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✓ Database '${process.env.DB_NAME}' created or already exists`);

    connection.end();
    console.log('✓ Database setup complete!');
  } catch (error) {
    console.error('Error creating database:', error);
    process.exit(1);
  }
};

createDatabase();
