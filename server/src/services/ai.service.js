const Groq = require('groq-sdk');
const config = require('../config');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

let groqClient = null;

function getClient() {
    if (!groqClient && config.groqApiKey) {
        groqClient = new Groq({ apiKey: config.groqApiKey });
    }
    return groqClient;
}

async function parseIntent(query, clarificationContext = null) {
    const client = getClient();

    if (!client) {
        throw new Error('AI Engine is not configured (Missing GROQ_API_KEY). Search cannot proceed without intent analysis.');
    }

    try {
        const sanitizedQuery = query
            .replace(/\b(near me|around me|close to me|nearby|here)\b/gi, '')
            .trim();

        let systemPrompt = `You are a query intent parser for a location-based recommendation engine.
Extract structured intent from user queries. Return ONLY valid JSON with these fields:
{
  "reasoning": "string (Short one-sentence explanation of how you interpreted this query)",
  "isOutOfScope": "boolean (true if the query is NOT about finding a place, service, or specific product/brand. e.g., 'how to cook', 'who is the president', 'solve 2+2')",
  "scopeMessage": "string or null (If isOutOfScope is true, provide a polite response explaining that RedThread is a specialized discovery engine for locations, services, and local products.)",
  "needsClarification": "boolean (true ONLY if the query is a single ambiguous word like 'apple' or 'monster' and you have NO idea what it means. false if it's a multi-word category like 'test labs' or 'coffee shop')",
  "clarificationQuestion": "string or null (If needsClarification is true, provide a conversational follow-up question.)",
  "category": "string (The broad type of place, e.g., shop, restaurant, electronics_store, medical_lab, coworking_space)",
  "isSpecific": "boolean (true if the user is looking for a VERY specific brand, product, or niche item)",
  "specificItem": "string or null (The exact name of the brand/product/item requested)",
  "location": "string or null (Extract ONLY the major city name. Do NOT extract words like 'me', 'here', or 'nearby'. If no city is found, return null. DO NOT set needsClarification=true just because the location is missing.)",
  "neighborhood": "string or null (Extract specific area if mentioned)",
  "budget": { "min": number|null, "max": number|null, "currency": "string" },
  "features": ["array of desired features"],
  "occasion": "string or null",
  "sortBy": "string (rating|price|distance|relevance)"
} - Note: If the query is multi-word (e.g. 'test labs'), match it to the closest category and set needsClarification: false. If it is completely unrelated to discovery, set isOutOfScope: true.`;

        if (clarificationContext) {
            systemPrompt += `\n\nCRITICAL CONTEXT: The user previously searched for "${clarificationContext.originalQuery}", and you asked them: "${clarificationContext.question}". The user answered: "${clarificationContext.answer}". 
You must analyze their answer to fully deduce their target. SET "needsClarification" TO FALSE unless their answer is completely incomprehensible. Do your absolute best to map their answer into the 'category', 'isSpecific', and 'specificItem' fields so the search can proceed!`;
        }

        logger.info(`Sending query to Groq LLaMA: "${sanitizedQuery}"`);

        const response = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                { role: 'user', content: sanitizedQuery },
            ],
            temperature: 0.1,
            max_tokens: 300,
        });

        const text = response.choices[0].message.content.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            console.log('--- AI RAW JSON ---');
            console.log(jsonMatch[0]);
            console.log('-------------------');
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('AI Engine returned an invalid response format.');
    } catch (err) {
        logger.error('AI intent parsing failed', { error: err.message });

        if (err.status === 429) {
            throw new AppError('The AI engine is currently busy. Please try your search again in a moment.', 429);
        }

        throw new AppError('AI parsing failed. Please try a different query.', 500);
    }
}

async function rankResults(intent, results) {
    const client = getClient();

    // If no client or results are empty, just slice the top 10 as fallback
    if (!client || !results || results.length === 0) {
        return results.slice(0, 10);
    }

    try {
        if (!Array.isArray(results) || results.length === 0) {
            return [];
        }

        logger.info(`Ranking ${results.length} results using LLaMA`);

        const userLocationStr = intent.userLocation
            ? `The user's EXACT CURRENT GPS COORDINATES are: Latitude ${intent.userLocation.lat}, Longitude ${intent.userLocation.lng}.`
            : '';

        const intentContext = `
USER INTENT:
- Target Category: ${intent.category || 'Any'}
- Specific Item: ${intent.isSpecific ? intent.specificItem : 'None'}
- Location: ${intent.location || 'Anywhere'} (Target Search Area)
${userLocationStr}
- Budget: Max ${intent.budget?.max || 'Unlimited'}
- Preferences: ${(intent.features || []).join(', ') || 'None'}
- Sort Priority: ${intent.sortBy || 'relevance'}
`;

        const resultsContext = results.map(r =>
            `ID: ${r.id} | Name: ${r.name} | Category: ${r.category} | Rating: ${r.rating} | Features: ${(r.features || []).join(', ')} | User Reviews: ${r.reviews && r.reviews.length ? JSON.stringify(r.reviews) : 'None'}`
        ).join('\n');

        const promptContext = intentContext + "\nAVAILABLE PLACES:\n" + resultsContext;

        const response = await client.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert location curator. The user searched for: ${JSON.stringify(intent)}.
I will provide a list of raw scraped places. Your job is to select up to the Top 10 best matching places that ACTUALLY fit the user's criteria.

CRITICAL FILTERING RULES:
1. THINK FIRST: Verify that the place logically matches the user's intent based on "Actual Map Type" and User Reviews.
2. If "intent.isSpecific" is true, DO NOT strictly filter by category. Instead, evaluate if the place logically sells the "specificItem" (e.g., a "Convenience Store" sells "Monster Energy"). If it's highly likely they sell it, include it!
3. If "intent.isSpecific" is false, and the place does not match the requested category, OMIT IT entirely (e.g., omit a Park if the user wants a Gym).
4. If EXACT CURRENT GPS COORDINATES are provided: Prioritize locations that mention proximity to the user's area in their features, address, or reviews.
5. You do not have to return 10 places. If only 3 places genuinely match, only return those 3.
6. If "User Reviews" are provided for a place, read them and summarize the general human consensus in ONE short sentence. If no reviews exist, leave the summary blank.

Return ONLY a valid JSON object with your overall reasoning and a final array of matched objects. No markdown outside the JSON.
Example format:
{
  "reasoning": "I excluded X because it is a park. Y and Z perfectly match the cafe intent.",
  "matches": [
    { "id": "gmaps-1", "reviewSummary": "Customers highly praise the cold brew and fast wifi." },
    { "id": "gmaps-2", "reviewSummary": "" }
  ]
}`
                },
                { role: 'user', content: promptContext }
            ],
            temperature: 0.1,
            max_tokens: 600
        });

        const text = response.choices[0].message.content.trim();

        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const rankedObjectsMatches = parsed.matches || [];

            // Re-map the IDs back to the original objects and inject the LLaMA review summary
            const rankedObjects = rankedObjectsMatches
                .map(match => {
                    const original = results.find(r => r.id === match.id);
                    if (original) {
                        return { ...original, reviewSummary: match.reviewSummary || null };
                    }
                    return null;
                })
                .filter(Boolean)
                .slice(0, 10);

            if (rankedObjects.length > 0) {
                return rankedObjects;
            } else {
                return [];
            }
        }

        logger.warn('AI ranking returned non-JSON', { text });
        return [];

    } catch (err) {
        logger.error('AI ranking failed', { error: err.message });
        return [];
    }
}

async function generateSemanticSuggestions(query) {
    const client = getClient();
    if (!client) {
        return [];
    }

    try {
        const response = await client.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                {
                    role: 'system',
                    content: `You are an intelligent search suggestion engine. Analyze the user query's meaning, detect its intent type, handle ambiguity, and generate 3 or 4 context-aware search suggestions. Return ONLY valid JSON:
{
  "intentType": "place" | "product" | "entertainment" | "concept" | "ambiguous",
  "confidenceScore": number (0.0 to 1.0),
  "strategy": "string (Explain your plan, e.g., 'Clarify multiple meanings' or 'Suggest local places')",
  "suggestions": [
     {"type": "suggestion", "text": "Specific, actionable search query 1"},
     {"type": "suggestion", "text": "Specific, actionable search query 2"},
     ...
  ]
}

Rules:
1. If intent is "place": suggest location-based queries (e.g., "best cafes near me", "cafes with wifi").
2. If intent is "product": suggest product-based queries (e.g., "best price for iPhone", "iPhone reviews").
3. If intent is "ambiguous" or confidence < 0.6 (e.g., "predator", "apple"): generate CLARIFICATION suggestions (e.g., "Predator gaming laptops", "Predator movie", "Apple store locations").
4. Keep suggestions short and natural. Ensure your output is purely the JSON.`
                },
                { role: 'user', content: query }
            ],
            temperature: 0.3, // Slightly higher temp for creative suggestions
            max_tokens: 300
        });

        const text = response.choices[0].message.content.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.suggestions || [];
        }
        return [];
    } catch (err) {
        logger.error('AI suggestion generation failed', { error: err.message });
        return [];
    }
}

async function generateDynamicFilters(intent) {
    const client = getClient();
    if (!client) {
        return [];
    }

    try {
        const response = await client.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                {
                    role: 'system',
                    content: `You are an AI UI Engineer designing a dynamic filter panel for a search application.
Based on the user's search intent, generate a JSON array of 3 to 5 highly relevant UI filters.

Return ONLY valid JSON in this exact structure:
{
  "filters": [
    { 
      "type": "range", 
      "id": "maxBudget", 
      "label": "Max Budget (₹)", 
      "min": 0, 
      "max": 10000, 
      "step": 500 
    },
    { 
      "type": "select", 
      "id": "features", 
      "label": "Features / Attributes", 
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"] 
    },
    { 
      "type": "sort", 
      "id": "sortBy", 
      "label": "Sort By", 
      "options": [
        {"value": "relevance", "label": "Relevance"},
        {"value": "rating", "label": "Highest Rating"},
        {"value": "price_low", "label": "Price: Low → High"}
      ] 
    }
  ]
}

Rules:
1. Always include EXACTLY one "sort" filter.
2. If the intent is a "place" (e.g., cafe, restaurant, gym), include features like WiFi, Outdoor Seating, AC, Parking.
3. If the intent is a "product" (e.g., energy drinks, phones), include features like Availability, In Stock, Brand.
4. If the intent is "service" (e.g., salon, mechanic), include features like Appointment Required, Walk-ins, Same Day.
5. Provide a "range" filter (like maxBudget) ONLY if price is a relevant factor. If it's an informational query, omit it.
6. The JSON payload must strictly match the above schema format as it will be parsed directly into React DOM nodes. Do NOT output markdown text outside the JSON block.`
                },
                { role: 'user', content: JSON.stringify(intent) }
            ],
            temperature: 0.2,
            max_tokens: 400
        });

        const text = response.choices[0].message.content.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.filters || [];
        }
        return [];
    } catch (err) {
        logger.error('Dynamic Filter generation failed', { error: err.message });
        return [];
    }
}

module.exports = { parseIntent, rankResults, generateSemanticSuggestions, generateDynamicFilters };
