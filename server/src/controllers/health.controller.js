const cache = require('../services/cache.service');
const orchestrator = require('../services/orchestrator.service');
const { success } = require('../utils/response');

async function getHealth(req, res, next) {
    try {
        const providers = await orchestrator.healthCheck();

        success(res, {
            status: 'online',
            version: '1.0.0',
            providers,
        });
    } catch (err) {
        next(err);
    }
}

function getCacheStats(req, res) {
    success(res, {
        cache: cache.getStats(),
    });
}

function clearCache(req, res) {
    cache.clear();
    success(res, { message: 'Cache cleared successfully' });
}

module.exports = { getHealth, getCacheStats, clearCache };
