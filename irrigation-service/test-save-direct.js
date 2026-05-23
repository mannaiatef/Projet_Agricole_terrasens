require('dotenv').config();
const Logger = require('./src/utils/logger');
const { pool } = require('./src/config/db');

/**
 * Test full recommendation insert flow without external dependencies
 */
async function testSaveRecommendation() {
  try {
    console.log('🧪 Testing direct database recommendation insert...\n');

    const recommendation = {
      parcel_id: 2,
      parcel_name: 'Test Parcel - Mocked',
      crop_name: 'Tomato',
      area_hectares: 2.5,
      water_amount_mm: 35.7,
      water_volume_m3: 8.925,
      duration_minutes: 180,
      priority: 'HIGH',
      recommended_time: '05:30:00',
      decision_reason: 'Automated test insertion - High water stress detected',
      calculations: {
        et0: 6.2,
        kc: 0.9,
        etc: 5.58,
        base_water_amount: 5.58,
        stress_adjustment: 1.2,
        humidity_adjustment: 1.07,
      },
      conditions: {
        stress_percentage: 65,
        stress_score: 9,
        ndvi: 0.52,
        temperature: 28,
        humidity: 45,
        rain_forecast_24h: 2.5,
        weather_description: 'Partly Cloudy',
      },
      location: {
        latitude: 33.5731,
        longitude: -7.5898,
        polygon: null,
      },
    };

    const connection = await pool.getConnection();
    try {
      const query = `
        INSERT INTO irrigation_recommendations (
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
        )
      `;

      const values = [
        recommendation.parcel_id,
        recommendation.parcel_name,
        recommendation.crop_name,
        recommendation.area_hectares,
        recommendation.water_amount_mm,
        recommendation.water_volume_m3,
        recommendation.duration_minutes,
        recommendation.priority,
        recommendation.recommended_time,
        recommendation.decision_reason,
        recommendation.calculations.et0,
        recommendation.calculations.kc,
        recommendation.calculations.etc,
        recommendation.calculations.base_water_amount,
        recommendation.calculations.stress_adjustment,
        recommendation.calculations.humidity_adjustment,
        recommendation.conditions.stress_percentage,
        recommendation.conditions.stress_score,
        recommendation.conditions.ndvi,
        recommendation.conditions.temperature,
        recommendation.conditions.humidity,
        recommendation.conditions.rain_forecast_24h,
        recommendation.conditions.weather_description,
        recommendation.location.latitude,
        recommendation.location.longitude,
      ];

      console.log('Inserting recommendation:', JSON.stringify(recommendation, null, 2));
      console.log('\n💾 Executing INSERT query...');

      const [result] = await connection.execute(query, values);
      console.log(`✅ INSERT successful! Row ID: ${result.insertId}`);

      // Verify the insert
      console.log('\n🔍 Verifying insert...');
      const [records] = await connection.execute(
        'SELECT * FROM irrigation_recommendations WHERE id = ?',
        [result.insertId]
      );

      if (records.length > 0) {
        console.log('✅ Verification successful!');
        console.log('Stored record:', JSON.stringify(records[0], null, 2));
      } else {
        console.log('❌ Verification failed - record not found!');
      }

      return result.insertId;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

testSaveRecommendation()
  .then((insertId) => {
    console.log(`\n✅ Test completed successfully - ID: ${insertId}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed');
    process.exit(1);
  });
