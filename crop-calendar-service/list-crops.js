const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  
  const [crops] = await conn.query('SELECT id, name FROM crops');
  console.log('Available crops:');
  crops.forEach(c => console.log(`  ${c.id}: ${c.name}`));
  
  await conn.end();
})();
