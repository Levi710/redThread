const logger = require('../utils/logger');
const cache = require('./cache.service');
const { paginate } = require('../utils/response');

/**
 * Provider Orchestrator
 *
 * Interview note: This implements the Chain of Responsibility pattern.
 * Providers are sorted by priority (lower = tried first). If a provider
 * fails, the orchestrator falls to the next one. Combined with caching,
 * this gives us: cache → provider1 → provider2 → ... → mock fallback.
 */
class ProviderOrchestrator {
    constructor() {
        this.providers = [];
    }

    register(provider) {
        this.providers.push(provider);
        this.providers.sort((a, b) => a.priority - b.priority);
        logger.info(`Provider registered: ${provider.name}`, {
            priority: provider.priority,
            total: this.providers.length,
        });
    }

    getProviders() {
        return this.providers.map(p => p.toJSON());
    }

    async search(intent, options = {}) {
        // 1. Check cache first
        const cached = cache.get(intent);
        if (cached) {
            const page = parseInt(options.page, 10) || 1;
            const limit = parseInt(options.limit, 10) || 10;
            const paginated = paginate(cached.results, page, limit);
            return {
                ...paginated,
                meta: {
                    ...cached.meta,
                    cached: true,
                    source: `${cached.meta.source} (cached)`,
                    scrapedAt: cached.meta.scrapedAt,
                },
            };
        }

        // 2. Try providers in priority order
        const enabledProviders = this.providers.filter(p => p.enabled);

        for (const provider of enabledProviders) {
            try {
                logger.info(`Trying provider: ${provider.name}`);
                const data = await this._executeWithTimeout(provider, intent);

                if (!data || !data.results) {
                    throw new Error('Provider returned invalid data structure');
                }

                // If no results, try the next provider
                if (data.results.length === 0) {
                    logger.info(`Provider ${provider.name} returned 0 results. Falling back to next...`);
                    continue;
                }

                // Cache successful non-empty results
                data.meta.scrapedAt = new Date().toISOString();
                cache.set(intent, data);

                // Paginate
                const page = parseInt(options.page, 10) || 1;
                const limit = parseInt(options.limit, 10) || 10;
                const paginated = paginate(data.results, page, limit);

                return {
                    ...paginated,
                    meta: {
                        ...data.meta,
                        cached: false,
                        source: provider.name,
                        scrapedAt: data.meta.scrapedAt,
                    },
                };
            } catch (err) {
                logger.warn(`Provider ${provider.name} failed`, { error: err.message });
                continue;
            }
        }

        // If all providers actually crashed/failed, return graceful empty state
        return {
            results: [],
            limit: parseInt(options.limit, 10) || 10,
            page: parseInt(options.page, 10) || 1,
            totalPages: 0,
            meta: { source: 'System', message: 'All data providers failed.' }
        };
    }

    async _executeWithTimeout(provider, intent) {
        return Promise.race([
            provider.search(intent),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Provider ${provider.name} timed out`)), provider.timeout)
            ),
        ]);
    }

    async healthCheck() {
        const results = {};
        for (const provider of this.providers) {
            try {
                results[provider.name] = await provider.healthCheck();
            } catch (err) {
                results[provider.name] = { healthy: false, error: err.message };
            }
        }
        results.cache = cache.getStats();
        return results;
    }
}

// Singleton orchestrator with providers registered
const DatabaseProvider = require('../providers/DatabaseProvider');
const OSMProvider = require('../providers/OSMProvider');

const orchestrator = new ProviderOrchestrator();

// Priority 1: Custom Scraped Database entries (most specific)
orchestrator.register(new DatabaseProvider());

// Priority 2: OpenStreetMap (Global fallback for real-time discovery)
orchestrator.register(new OSMProvider());

module.exports = orchestrator;
