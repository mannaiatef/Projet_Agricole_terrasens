const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  
  const [stages] = await conn.query('SELECT id, crop_id, name, stage_order FROM stages WHERE id IN (1,2,3,7,8,9) ORDER BY id');
  console.log('Stage details:');
  stages.forEach(s => {
    console.log(`  ID ${s.id}: ${s.name} (crop=${s.crop_id}, order=${s.stage_order})`);
  });
  
  // Also check what stages exist for crop 2 (Maize)
  console.log('\nStages for Crop 2 (Maize):');
  const [maizeStages] = await conn.query('SELECT id, name, stage_order FROM stages WHERE crop_id = 2 ORDER BY stage_order');
  maizeStages.forEach(s => {
    console.log(`  ID ${s.id}: ${s.name} (order=${s.stage_order})`);
  });
  
  await conn.end();
})();
