const BaseProvider = require('./BaseProvider');
const logger = require('../utils/logger');

class OSMProvider extends BaseProvider {
    constructor() {
        super('osm_nominatim', { priority: 2, timeout: 5000 });
        this.baseUrl = 'https://nominatim.openstreetmap.org/search';
    }

    async search(intent, pagination) {
        const { category = 'place', location, neighborhood } = intent;

        const area = [neighborhood, location].filter(Boolean).join(', ');

        // If neither neighborhood nor location were parsed by AI, use the raw query as fallback
        const searchTerm = category === 'all'
            ? `places ${area ? 'in ' + area : ''}`.trim()
            : `${category} ${area ? 'in ' + area : ''}`.trim();
        logger.info(`OSMProvider requested Nominatim query: "${searchTerm}"`);

        const params = new URLSearchParams({
            q: searchTerm,
            format: 'json',
            limit: 15,
            addressdetails: 1,
            extratags: 1
        });

        const url = `${this.baseUrl}?${params.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'RedThreadBot/1.0 (https://github.com/ayush/redthread)'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim API Error: ${response.status}`);
        }

        const data = await response.json();

        const results = data.map(el => {
            const extratags = el.extratags || {};

            // Extract genuine real-world features from OSM metadata (no fakeism)
            const realFeatures = [];
            if (extratags.internet_access === 'wlan' || extratags.wifi === 'yes') realFeatures.push('WiFi');
            if (extratags.wheelchair === 'yes') realFeatures.push('Wheelchair Accessible');
            if (extratags.outdoor_seating === 'yes') realFeatures.push('Outdoor Seating');
            if (extratags.air_conditioning === 'yes') realFeatures.push('AC');
            if (extratags.takeaway === 'yes') realFeatures.push('Takeaway');
            if (extratags.delivery === 'yes') realFeatures.push('Delivery');
            if (extratags.diet_vegan === 'yes' || extratags.vegan === 'yes') realFeatures.push('Vegan Options');
            if (extratags.parking === 'yes') realFeatures.push('Parking');

            return {
                id: `osm-${el.place_id}`,
                name: el.name || `Unnamed ${el.type || category}`,
                category: el.type || category,
                address: el.display_name,
                rating: extratags.rating || 'N/A', // OSM rarely has ratings, fallback to honest N/A
                priceRange: extratags.price || extratags.charge || 'N/A', // Honest fallback instead of RNG
                features: realFeatures,
                coordinates: { lat: el.lat, lon: el.lon },
                source: this.name
            };
        });

        return {
            results,
            meta: {
                total: results.length,
                source: this.name,
                providerTime: new Date().toISOString()
            }
        };
    }

    async healthCheck() {
        try {
            const start = Date.now();
            const res = await fetch(`${this.baseUrl}?q=Bhubaneswar&format=json&limit=1`, {
                headers: { 'User-Agent': 'RedThreadBot/1.0' }
            });
            if (res.ok) {
                return { status: 'up', latency: Date.now() - start };
            }
            return { status: 'down', error: `HTTP ${res.status}` };
        } catch (err) {
            return { status: 'down', error: err.message };
        }
    }
}

module.exports = OSMProvider;
