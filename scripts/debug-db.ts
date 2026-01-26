import mysql from 'mysql2/promise'

const DB_CONFIG = {
    host: '195.35.11.179',
    port: 3306,
    user: 'root',
    password: 'Mvergel*',
    database: 'u889902058_sonda0109'
}

async function debugDb() {
    let db;
    try {
        db = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to DB');

        const [columns] = await db.query('SHOW COLUMNS FROM instalacion') as any;
        console.log('📊 Columns in instalacion:');
        console.table(columns);

        const [tables] = await db.query('SHOW TABLES') as any;
        console.log('📊 Tables:');
        if (Array.isArray(tables)) {
            console.log(tables.map((t: any) => Object.values(t)[0]));
        } else {
            console.log(tables);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (db) await db.end();
    }
}

debugDb();
