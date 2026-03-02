const { getDb } = require('./server/src/db/database');

async function checkRows() {
    try {
        const db = await getDb();
        const count = await db.get('SELECT COUNT(*) as count FROM places');
        console.log(`TOTAL ROWS: ${count.count}`);

        const first = await db.get('SELECT * FROM places LIMIT 1');
        console.log('FIRST ROW:', JSON.stringify(first, null, 2));
    } catch (err) {
        console.error('Debug failed:', err.message);
    } finally {
        process.exit(0);
    }
}

checkRows();
