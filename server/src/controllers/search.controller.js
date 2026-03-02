const aiService = require('../services/ai.service');
const orchestrator = require('../services/orchestrator.service');
const scrapeGoogleMaps = require('../scripts/scraper');
const logger = require('../utils/logger');
const { success } = require('../utils/response');

async function handleSearch(req, res, next) {
    try {
        const { query, location, filters, userLocation, clarificationContext, page, limit } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        logger.info('Search request received', { query, location, clarificationContext });

        const intent = await aiService.parseIntent(query, clarificationContext);
        logger.info('Intent parsed', { intent });

        if (intent.isOutOfScope) {
            logger.info('Query out of scope. Providing guidance.', { message: intent.scopeMessage });
            return res.json({
                success: true,
                isOutOfScope: true,
                scopeMessage: intent.scopeMessage,
                intent
            });
        }

        if (intent.needsClarification) {
            logger.info('Query ambiguous. Requesting clarification.', { question: intent.clarificationQuestion });
            return res.json({
                success: true,
                needsClarification: true,
                clarificationQuestion: intent.clarificationQuestion,
                intent
            });
        }

        if (location && !intent.location) {
            intent.location = location;
        }

        // If they provided GPS, synthesize a generic location tag so the database schema doesn't crash on NULL
        if (!intent.location && userLocation && userLocation.lat) {
            intent.location = 'User Proximity';
        }

        // Phase: Sanitize "me/nearby" if coordinates are active
        if (intent.location && (intent.location.toLowerCase() === 'me' || intent.location.toLowerCase() === 'nearby') && userLocation && userLocation.lat) {
            intent.location = 'User Proximity';
        }

        if (!intent.location) {
            return res.status(400).json({
                success: false,
                error: 'Please specify a location (e.g., "cafes in Paris" or use the location filter).'
            });
        }

        if (filters) {
            intent.features = [...(intent.features || []), ...(filters.features || [])];
            if (filters.maxBudget) {
                intent.budget = { ...intent.budget, max: filters.maxBudget };
            }
            if (filters.category && filters.category !== 'all') {
                intent.category = filters.category;
            }
            if (filters.sortBy) {
                intent.sortBy = filters.sortBy;
            }
        }

        // Append explicit GPS coordinates if the client provided them
        if (userLocation && userLocation.lat && userLocation.lng) {
            intent.userLocation = userLocation;
            logger.info(`Attached user GPS coordinates to intent: ${userLocation.lat}, ${userLocation.lng}`);
        }

        // Pass the request to the orchestrator
        let data = await orchestrator.search(intent, { page, limit });

        // Phase 14: Smart "Soft-Miss" Detection
        const checkSatisfaction = () => {
            if (!intent.isSpecific || !intent.specificItem) return true;
            const item = intent.specificItem.toLowerCase();
            return data.results.some(r => {
                const searchSpace = [
                    r.name,
                    ...(r.features || []),
                    r.rawCategory || '',
                    r.reviewSummary || ''
                ].join(' ').toLowerCase();
                return searchSpace.includes(item);
            });
        };

        const isDeeplySatisfied = checkSatisfaction();

        // Phase 12 & 14: Trigger Scraper on:
        // - Completely empty results, OR
        // - Specific-item searches that are not well satisfied, OR
        // - Very sparse generic results (e.g., fewer than 3 places)
        const hasNoResults = data.results.length === 0;
        const hasVeryFewGenericResults = !intent.isSpecific && data.results.length > 0 && data.results.length < 3;
        const shouldTriggerScrape = hasNoResults || !isDeeplySatisfied || hasVeryFewGenericResults;

        if (shouldTriggerScrape) {
            const reason = hasNoResults
                ? '0 results found'
                : !isDeeplySatisfied
                    ? 'Generic results found for niche item'
                    : 'Very few results found for broad query';

            logger.info(`${reason} in DB. Auto-triggering headless scraper...`, { query, item: intent.specificItem });

            try {
                // For specific items, we MUST use the full query to find the brand in Maps
                const scrapeQuery = intent.isSpecific ? query : (intent.category || query);
                await scrapeGoogleMaps(scrapeQuery, intent.category || 'all', intent.location, intent.userLocation);

                logger.info('Auto-scrape complete. Re-querying Orchestrator...');
                data = await orchestrator.search(intent, { page, limit });
            } catch (scrapeErr) {
                logger.error('Auto-scraping failed silently:', scrapeErr.message);
            }
        }

        logger.info('Sending raw results to AI for ranking and generating dynamic filters', { count: data.results.length });
        const [rankedResults, dynamicFilters] = await Promise.all([
            aiService.rankResults(intent, data.results),
            aiService.generateDynamicFilters(intent)
        ]);
        logger.info('AI ranking complete', { topCount: rankedResults.length });

        // --- Discovery Quotes (Your Name & Inspiration) ---
        const quotes = [
            "Musubi is the old way of calling the guardian god. To tie thread is Musubi. To connect people is Musubi. The flow of time is Musubi.",
            "I’m always searching for something, a person, a place... I don't know what it is or where it is, but I know it's important to me...",
            "Treasure the experience. Dreams fade away after you wake up.",
            "Wherever you are in the world, I'll search for you.",
            "It's like a dream. It's like a miracle.",
            "The names are... Mitsuha! Taki!",
            "Once in a while when I wake up. I find myself crying.",
            "I wanted to tell you that... wherever you may end up in this world, I will search for you.",
            "There's no way we could meet. But one thing is certain. If we see each other, we'll know. That you were the one who lived inside me. That I am the one who lived inside you."
        ];

        const isMovieQuery = query.toLowerCase().includes('your name') ||
            query.toLowerCase().includes('kimi no na wa') ||
            (intent.reasoning && intent.reasoning.toLowerCase().includes('kimi no na wa')) ||
            (intent.reasoning && intent.reasoning.toLowerCase().includes('your name'));

        // Activate quote if results are 0 (to cheer up the user) OR if it's a specific movie query
        const easterEgg = (isMovieQuery || rankedResults.length === 0)
            ? quotes[Math.floor(Math.random() * quotes.length)]
            : null;

        success(res, {
            query,
            intent,
            results: rankedResults,
            dynamicFilters,
            easterEgg,
            meta: {
                ...data.meta,
                total: rankedResults.length,
                rankedByAI: true
            },
        });
    } catch (err) {
        logger.error('CRITICAL SEARCH ERROR:', {
            message: err.message,
            stack: err.stack,
            query: req.body.query
        });
        next(err);
    }
}

module.exports = { handleSearch };
