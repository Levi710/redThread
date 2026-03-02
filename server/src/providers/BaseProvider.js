/**
 * Base Provider Interface
 * All scraping providers must implement this contract.
 *
 * Interview note: This is the Strategy Pattern — each provider is a concrete
 * strategy that the orchestrator selects at runtime. Adding a new data source
 * (Google Places, Yelp, etc.) means creating a new class — zero changes to
 * the orchestrator or controller.
 */
class BaseProvider {
    constructor(name, options = {}) {
        this.name = name;
        this.priority = options.priority || 10;
        this.enabled = options.enabled !== false;
        this.timeout = options.timeout || 10000;
    }

    /**
     * Search for places matching the given intent.
     * @param {Object} intent - Parsed user intent
     * @returns {Promise<{ results: Array, meta: Object }>}
     */
    async search(intent) {
        throw new Error(`Provider ${this.name} must implement search()`);
    }

    /**
     * Health check for the provider.
     * @returns {Promise<{ healthy: boolean, latency: number }>}
     */
    async healthCheck() {
        return { healthy: this.enabled, latency: 0 };
    }

    toJSON() {
        return {
            name: this.name,
            priority: this.priority,
            enabled: this.enabled,
        };
    }
}

module.exports = BaseProvider;
