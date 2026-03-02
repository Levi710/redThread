const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, 'locations.sqlite');

let dbInstance = null;

async function getDb() {
    if (dbInstance) return dbInstance;

    dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS places (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            rating TEXT,
            priceRange TEXT,
            features TEXT,
            lat REAL,
            lon REAL,
            scrapedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            reviews TEXT DEFAULT '[]'
        );
        
        CREATE INDEX IF NOT EXISTS idx_category_city ON places(category, city);
    `);

    // Phase 13 Non-Destructive Schema Patch
    try {
        await dbInstance.exec(`ALTER TABLE places ADD COLUMN reviews TEXT DEFAULT '[]'`);
    } catch (err) {
        // If the column already exists (due to a prior run), SQLite will throw an error. We can safely ignore it.
        if (!err.message.includes('duplicate column name')) {
            console.warn('Silent DB Patch Warning:', err.message);
        }
    }

    return dbInstance;
}

module.exports = { getDb };
