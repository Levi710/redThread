const { getDb } = require('./server/src/db/database');

async function debugCoords() {
    try {
        const db = await getDb();
        const rows = await db.all('SELECT name, lat, lon, scrapedAt FROM places WHERE scrapedAt > datetime("now", "-10 minutes")');
        console.log(`FOUND ${rows.length} RECENT ROWS`);
        rows.forEach(r => {
            console.log(`- ${r.name}: lat=${r.lat}, lon=${r.lon} [${typeof r.lat}]`);
        });
    } catch (err) {
        console.error('Debug failed:', err.message);
    } finally {
        process.exit(0);
    }
}

debugCoords();
