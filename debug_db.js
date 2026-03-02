const { getDb } = require('./server/src/db/database');

async function debugDb() {
    try {
        const db = await getDb();
        const rows = await db.all('SELECT name, city, lat, lon, scrapedAt FROM places ORDER BY scrapedAt DESC LIMIT 10');
        console.log('--- LATEST ENTRIES ---');
        console.table(rows);
    } catch (err) {
        console.error('Debug failed:', err.message);
    } finally {
        process.exit(0);
    }
}

debugDb();
