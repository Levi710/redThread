const { getDb } = require('../db/database');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');
const aiService = require('../services/ai.service');

async function getSuggestions(req, res, next) {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return success(res, { suggestions: [] });
        }

        const lower = q.toLowerCase().trim();
        const db = await getDb();

        // 1. Fetch real matches from the local database
        const rows = await db.all(
            'SELECT id, name, category FROM places WHERE name LIKE ? LIMIT 5',
            [`%${lower}%`]
        );

        const dbMatches = rows.map(r => ({
            type: 'place',
            text: r.name,
            category: r.category,
            id: r.id
        }));

        // 2. Supplement with AI Semantic Suggestions
        const aiSuggestions = await aiService.generateSemanticSuggestions(q);

        // Combine them: Database hits first (definite matches), then AI suggestions
        const suggestions = [...dbMatches, ...aiSuggestions].slice(0, 8);

        success(res, { suggestions });
    } catch (err) {
        next(err);
    }
}

async function getPlaceById(req, res, next) {
    try {
        const { id } = req.params;
        const db = await getDb();

        const row = await db.get('SELECT * FROM places WHERE id = ?', [id]);

        if (!row) {
            throw new AppError('Place not found in records', 404);
        }

        const place = {
            id: row.id,
            name: row.name,
            category: row.category,
            address: row.address,
            rating: row.rating,
            priceRange: row.priceRange,
            features: JSON.parse(row.features || '[]'),
            reviews: JSON.parse(row.reviews || '[]'),
            coordinates: { lat: row.lat, lon: row.lon }
        };

        success(res, { place });
    } catch (err) {
        next(err);
    }
}

module.exports = { getSuggestions, getPlaceById };
