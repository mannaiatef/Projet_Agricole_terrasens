/**
 * CHECK DATABASE SCHEMA
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDB() {
  let connection;

  try {
    console.log('Connecting to:', {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
    });

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('\n✓ Connected\n');

    // List all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in database:');
    tables.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(`  - ${tableName}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDB();
