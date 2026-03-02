const { getDb } = require('../db/database');
const { success } = require('../utils/response');

async function getCategories(req, res) {
    const db = await getDb();
    const rows = await db.all('SELECT DISTINCT category FROM places ORDER BY category ASC');

    let categories = rows.map(r => r.category).filter(Boolean);

    // If no data yet, provide a base set of targets for the scraper to aim for
    if (categories.length === 0) {
        categories = ['cafe', 'restaurant', 'gym', 'electronics_store', 'pharmacy', 'hospital', 'salon', 'pub'];
    }

    success(res, { categories });
}

module.exports = { getCategories };
