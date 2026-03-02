const logger = require('../utils/logger');

/**
 * In-memory TTL Cache
 *
 * Interview note: This is a hash-map cache with lazy expiration.
 * Keys are hashed intent signatures. Values expire after TTL.
 *
 * Why not Redis? At this scale (single server, <10K users), in-memory
 * is simpler, zero-latency, and zero-dependency. Redis makes sense when
 * you need persistence across restarts or shared cache across instances.
 */
class CacheService {
    constructor(options = {}) {
        this.store = new Map();
        this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes
        this.maxSize = options.maxSize || 500;
        this.hits = 0;
        this.misses = 0;
        this.evictions = 0;

        // Periodic cleanup every 60s
        this._cleanupInterval = setInterval(() => this._cleanup(), 60000);
    }

    /**
     * Generate a deterministic cache key from an intent object.
     */
    _makeKey(intent) {
        const normalized = {
            category: intent.category || 'all',
            location: (intent.location || '').toLowerCase().trim(),
            budget: intent.budget?.max || '',
            features: (intent.features || []).sort().join(','),
            sortBy: intent.sortBy || 'relevance',
        };
        return JSON.stringify(normalized);
    }

    get(intent) {
        const key = this._makeKey(intent);
        const entry = this.store.get(key);

        if (!entry) {
            this.misses++;
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        logger.info('Cache HIT', { key: key.substring(0, 60) });
        return entry.value;
    }

    set(intent, value, ttl) {
        const key = this._makeKey(intent);

        if (this.store.size >= this.maxSize) {
            this._evictOldest();
        }

        this.store.set(key, {
            value,
            createdAt: Date.now(),
            expiresAt: Date.now() + (ttl || this.defaultTTL),
        });
    }

    _evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.store) {
            if (entry.createdAt < oldestTime) {
                oldestTime = entry.createdAt;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.store.delete(oldestKey);
            this.evictions++;
        }
    }

    _cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.store) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger.info('Cache cleanup', { cleaned, remaining: this.store.size });
        }
    }

    invalidate(intent) {
        const key = this._makeKey(intent);
        return this.store.delete(key);
    }

    clear() {
        this.store.clear();
        this.hits = 0;
        this.misses = 0;
        this.evictions = 0;
    }

    getStats() {
        const total = this.hits + this.misses;
        return {
            size: this.store.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            evictions: this.evictions,
            hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0%',
            ttl: this.defaultTTL,
        };
    }

    destroy() {
        clearInterval(this._cleanupInterval);
        this.store.clear();
    }
}

// Singleton
const cache = new CacheService();

module.exports = cache;
