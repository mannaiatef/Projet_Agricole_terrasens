const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'terrasens_auth'
        });

        console.log('✅ Connexion à MySQL établie avec succès');

        const [tables] = await connection.query('SHOW TABLES');
        console.log('\n📋 Tables disponibles :');
        console.table(tables);

        const [rows] = await connection.query('SELECT * FROM users LIMIT 5');
        console.log('\n📊 Test de lecture :');
        console.table(rows);

        await connection.end();

        console.log('\n✅ Test terminé avec succès');
    } catch (error) {
        console.error('❌ Erreur de connexion :');
        console.error(error.message);
    }
}

testConnection();