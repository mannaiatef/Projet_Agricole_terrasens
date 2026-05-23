require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'terrasens_irrigation',
    });

    console.log('✅ Connected to database!');

    // Check tables
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()"
    );
    console.log('\n📋 Tables in database:');
    tables.forEach((t) => console.log(`  - ${t.TABLE_NAME}`));

    // Check irrigation_recommendations table structure
    if (tables.some((t) => t.TABLE_NAME === 'irrigation_recommendations')) {
      console.log('\n✅ irrigation_recommendations table exists');
      const [columns] = await connection.execute(
        "SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'irrigation_recommendations' AND TABLE_SCHEMA = DATABASE()"
      );
      console.log('Columns:', columns.map((c) => `${c.COLUMN_NAME} (${c.COLUMN_TYPE})`).join(', '));

      // Try a test insert
      console.log('\n🧪 Testing INSERT...');
      const testData = {
        parcel_id: 999,
        parcel_name: 'Test Parcel',
        crop_name: 'Wheat',
        area_hectares: 1.5,
        water_amount_mm: 25.5,
        water_volume_m3: 3.825,
        duration_minutes: 120,
        priority: 'MEDIUM',
        recommended_time: '06:00:00',
        decision_reason: 'Test insertion',
        et0: 5.0,
        kc: 0.8,
        etc: 4.0,
        base_water_amount: 4.0,
        stress_adjustment: 1.0,
        humidity_adjustment: 1.0,
        stress_percentage: 30,
        stress_score: 5,
        ndvi: 0.65,
        temperature: 25,
        humidity: 60,
        rain_forecast_24h: 0,
        weather_description: 'Sunny',
        parcel_latitude: 35.123,
        parcel_longitude: -2.456,
      };

      try {
        const [result] = await connection.execute(
          `INSERT INTO irrigation_recommendations (
            parcel_id, parcel_name, crop_name, area_hectares,
            water_amount_mm, water_volume_m3, duration_minutes,
            priority, recommended_time, decision_reason,
            et0, kc, etc, base_water_amount, stress_adjustment, humidity_adjustment,
            stress_percentage, stress_score, ndvi, temperature, humidity,
            rain_forecast_24h, weather_description,
            parcel_latitude, parcel_longitude
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?
          )`,
          [
            testData.parcel_id,
            testData.parcel_name,
            testData.crop_name,
            testData.area_hectares,
            testData.water_amount_mm,
            testData.water_volume_m3,
            testData.duration_minutes,
            testData.priority,
            testData.recommended_time,
            testData.decision_reason,
            testData.et0,
            testData.kc,
            testData.etc,
            testData.base_water_amount,
            testData.stress_adjustment,
            testData.humidity_adjustment,
            testData.stress_percentage,
            testData.stress_score,
            testData.ndvi,
            testData.temperature,
            testData.humidity,
            testData.rain_forecast_24h,
            testData.weather_description,
            testData.parcel_latitude,
            testData.parcel_longitude,
          ]
        );
        console.log(`✅ Test insert successful! Row ID: ${result.insertId}`);

        // Try to read it back
        const [rows] = await connection.execute(
          'SELECT * FROM irrigation_recommendations WHERE parcel_id = 999'
        );
        console.log(`✅ Read back ${rows.length} rows`);
        if (rows.length > 0) {
          console.log('First row:', JSON.stringify(rows[0], null, 2));
        }
      } catch (error) {
        console.error('❌ INSERT failed:', error.message);
        console.error('Full error:', error);
      }
    } else {
      console.log('\n❌ irrigation_recommendations table NOT found!');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
