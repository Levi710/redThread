const BaseProvider = require('./BaseProvider');
const { getDb } = require('../db/database');
const logger = require('../utils/logger');


class DatabaseProvider extends BaseProvider {
    constructor() {
        super('custom_db', { priority: 1, timeout: 60000 });
    }

    async search(intent) {
        if (!intent.category || !intent.location) {
            throw new Error('DatabaseProvider requires both category and location');
        }

        const db = await getDb();
        const city = intent.location.toLowerCase();
        let query, params;

        // If GPS is provided, we prioritize proximity over city-string matching
        if (intent.userLocation && intent.userLocation.lat && intent.userLocation.lng) {
            const { lat, lng } = intent.userLocation;
            const radius = 0.1; // roughly 10km in coordinate degrees for SQLite simplicity 

            if (intent.isSpecific && intent.specificItem) {
                const item = `%${intent.specificItem.toLowerCase()}%`;
                query = `
                    SELECT *, 
                    ((lat - ?) * (lat - ?) + (lon - ?) * (lon - ?)) AS distance_sq
                    FROM places 
                    WHERE (category = ? OR name LIKE ? OR features LIKE ?)
                    AND (city LIKE ? OR (lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?))
                    ORDER BY distance_sq ASC
                `;
                params = [lat, lat, lng, lng, intent.category.toLowerCase(), item, item, `%${city}%`, lat - radius, lat + radius, lng - radius, lng + radius];
            } else {
                query = `
                    SELECT *, 
                    ((lat - ?) * (lat - ?) + (lon - ?) * (lon - ?)) AS distance_sq
                    FROM places 
                    WHERE category = ? 
                    AND (city LIKE ? OR (lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?))
                    ORDER BY distance_sq ASC
                `;
                params = [lat, lat, lng, lng, intent.category.toLowerCase(), `%${city}%`, lat - radius, lat + radius, lng - radius, lng + radius];
            }
            logger.info(`Performing spatial proximity search near ${lat}, ${lng} (extracted location: ${city})...`);
        } else {
            // Standard city-string matching
            if (intent.isSpecific && intent.specificItem) {
                const item = `%${intent.specificItem.toLowerCase()}%`;
                query = `
                    SELECT * FROM places 
                    WHERE (category = ? OR name LIKE ? OR features LIKE ?)
                    AND LOWER(city) LIKE ?
                `;
                params = [intent.category.toLowerCase(), item, item, `%${city}%`];
            } else {
                query = `
                    SELECT * FROM places 
                    WHERE category = ? AND LOWER(city) LIKE ?
                `;
                params = [intent.category.toLowerCase(), `%${city}%`];
            }
            logger.info(`Querying custom DB for ${intent.category} in ${city}...`);
        }

        const rows = await db.all(query, params);

        if (!rows || rows.length === 0) {
            logger.warn(`No entries found in DB for ${intent.category} in ${city}. Run the scraper script first!`);
            return {
                results: [],
                meta: {
                    source: this.name,
                    total: 0
                }
            };
        }

        const safeParse = (str, fallback = []) => {
            try {
                return str ? JSON.parse(str) : fallback;
            } catch (e) {
                logger.warn('Failed to parse JSON column in database', { error: e.message, content: str });
                return fallback;
            }
        };

        const results = rows.map(row => ({
            id: row.id,
            name: row.name,
            category: row.category,
            address: row.address,
            rating: row.rating || 'N/A',
            priceRange: row.priceRange || 'N/A',
            features: safeParse(row.features),
            reviews: safeParse(row.reviews),
            coordinates: { lat: row.lat, lon: row.lon },
            source: this.name
        }));

        logger.info(`Custom DB returned ${results.length} results.`);

        return {
            results,
            meta: {
                source: this.name,
                total: results.length
            }
        };
    }
}

module.exports = DatabaseProvider;
