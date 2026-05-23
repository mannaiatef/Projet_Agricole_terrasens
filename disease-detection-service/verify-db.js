/**
 * Database verification script
 * Tests that the disease detection database is properly configured
 */
const Database = require('./src/config/database');

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database connection...\n');

    // Initialize database pool
    await Database.initialize();

    // Test query
    const result = await Database.query('SELECT 1 as verification');
    console.log('✅ Database connection successful');

    // Check tables exist
    const tables = await Database.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'terrasens_disease_db'
    `);

    console.log('\n📊 Tables in terrasens_disease_db:');
    tables.forEach(table => {
      console.log(`   ✓ ${table.TABLE_NAME}`);
    });

    // Check disease_analysis table structure
    const diseaseAnalysisColumns = await Database.query(`
      SHOW COLUMNS FROM disease_analysis
    `);

    console.log('\n📋 disease_analysis table columns:');
    diseaseAnalysisColumns.forEach(col => {
      console.log(`   • ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
    });

    // Check analysis_images table structure
    const imageColumns = await Database.query(`
      SHOW COLUMNS FROM analysis_images
    `);

    console.log('\n📸 analysis_images table columns:');
    imageColumns.forEach(col => {
      console.log(`   • ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
    });

    console.log('\n✨ Database verification completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database verification error:', error.message);
    process.exit(1);
  }
}

verifyDatabase();
