require('dotenv').config();
const { pool } = require('./src/config/db');

async function checkDatabase() {
  const connection = await pool.getConnection();
  try {
    // Check recent records in irrigation_recommendations
    const [rows] = await connection.execute(
      `SELECT id, parcel_id, parcel_name, water_amount_mm, created_at 
       FROM irrigation_recommendations 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    console.log('📊 Latest 5 recommendations in database:');
    if (rows.length === 0) {
      console.log('❌ NO RECORDS FOUND');
    } else {
      console.table(rows);
    }

    // Count by date
    const [counts] = await connection.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM irrigation_recommendations 
       GROUP BY DATE(created_at) 
       ORDER BY date DESC 
       LIMIT 10`
    );

    console.log('\n📈 Records by date:');
    console.table(counts);

  } finally {
    connection.release();
  }
}

checkDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
