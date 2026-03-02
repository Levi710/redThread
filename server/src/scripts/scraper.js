const puppeteer = require('puppeteer');
const { getDb } = require('../db/database');
const crypto = require('crypto');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeGoogleMaps(query, category, city, userLocation = null) {
    if (userLocation) {
        console.log(`Starting LOCAL web scrape for: "${query}" near coordinates ${userLocation.lat}, ${userLocation.lng}...`);
    } else {
        console.log(`Starting web scrape for: "${query}" in ${city || 'unknown region'}...`);
    }

    const db = await getDb();

    // Launch headless browser
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Set a normal user agent to bypass basic bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        let url;
        if (userLocation && userLocation.lat && userLocation.lng) {
            // Anchor search around the specific GPS coordinates with a 15z zoom level
            url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${userLocation.lat},${userLocation.lng},15z`;
        } else {
            // Fallback to standard text search
            url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/`;
        }

        console.log(`Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        console.log('Waiting for search results to render...');
        await delay(5000); // Give Maps time to load the dynamic React list

        // Extract data directly from the DOM using page.evaluate
        const results = await page.evaluate(() => {
            const places = [];
            // Target the result container cards
            const elements = document.querySelectorAll('div[role="article"]');

            elements.forEach(el => {
                const linkEl = el.querySelector('a[href*="/maps/place/"]');
                if (!linkEl) return;

                const url = linkEl.href;
                const name = el.getAttribute('aria-label') || '';

                if (!name) return;

                const textTokens = el.innerText.split('\n').map(t => t.trim()).filter(Boolean);

                let rating = 'N/A';
                let rawCategory = '';
                let address = '';

                // Extract Rating (e.g. "4.6(1,011)" or "4.6") from the text tokens
                for (const token of textTokens) {
                    const ratingMatch = token.match(/^(\d+\.\d+)(?:\(|\s|$)/);
                    if (ratingMatch) {
                        rating = ratingMatch[1];
                        break;
                    }
                }

                let priceRange = 'N/A';

                // Extract Price Range (usually containing ₹, $, £, €)
                for (const token of textTokens) {
                    const priceMatch = token.match(/([₹$£€]+)/);
                    if (priceMatch) {
                        priceRange = priceMatch[1];
                        break;
                    }
                }

                // Extract Category and Address
                // Google Maps cards usually have: Name -> Rating/Price/Category -> Address
                for (let i = 0; i < textTokens.length; i++) {
                    const token = textTokens[i];

                    // Category usually follows rating or has a bullet
                    if (token.includes('·')) {
                        const parts = token.split('·');
                        rawCategory = parts[0].trim();
                        // If there is more, it might be address hint or busy-ness
                    }

                    // Address usually contains numbers and doesn't match name/category/rating
                    if (token.match(/\d+/) && token !== rating && token.length > 10 && !token.includes('(')) {
                        address = token;
                    }
                }

                if (name && !places.some(p => p.name === name)) {
                    places.push({
                        name: name,
                        rawCategory: rawCategory,
                        address: address, // Real address extracted from card
                        rating: rating,
                        priceRange: priceRange,
                        url: url
                    });
                }
            });

            // Capture more than just the absolute top results so that
            // popular chains and nearby options have a better chance
            // of being included in our custom database.
            return places.slice(0, 12); // Take top 12
        });

        console.log(`Successfully scraped ${results.length} raw locations.`);

        if (results.length === 0) {
            console.log("No results found on the first page. Note: Google Maps might be blocking headless requests or changing DOM selectors.");
            await browser.close();
            return;
        }

        // Phase 13: Deep Review Extraction
        console.log('Navigating to physical place pages to scrape user reviews... (This will take longer due to active loading requests)');
        for (let i = 0; i < results.length; i++) {
            const place = results[i];
            console.log(`[${i + 1}/${results.length}] Deep Scraping: ${place.name}`);
            try {
                const detailPage = await browser.newPage();
                await detailPage.setViewport({ width: 1920, height: 1080 });
                await detailPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

                // Allow network requests to settle so the dynamic review div renders
                await detailPage.goto(place.url, { waitUntil: 'networkidle2', timeout: 35000 });

                // Maps often requires a brief physical pause to hydrate React children components fully
                await delay(3000);

                // Extract up to 3 text reviews
                const extractedReviews = await detailPage.evaluate(() => {
                    const reviewElements = Array.from(document.querySelectorAll('.wiI7pd'));
                    // wiI7pd is the highly-stable Google Maps class for body text of user reviews
                    return reviewElements
                        .map(el => el.textContent.trim())
                        .filter(text => text.length > 10) // Ignore "Good." or empty strings
                        .slice(0, 3);
                });

                place.reviews = extractedReviews;

                // CRITICAL: Capture the final URL after navigation/redirection. 
                // This URL usually contains the @lat,lon coordinates needed for spatial search.
                const finalUrl = detailPage.url();
                if (finalUrl.includes('@')) {
                    place.url = finalUrl;
                }

                console.log(`    -> Harvested ${extractedReviews.length} reviews and updated URL.`);

                await detailPage.close();
            } catch (deepScrapeErr) {
                console.error(`    -> Failed to deep scrape ${place.name}: ${deepScrapeErr.message}`);
                place.reviews = [];
            }
        }

        // Clean and prepare the scraped data for our DB
        console.log('Inserting scraped data into custom SQLite database...');
        let insertedCount = 0;

        for (const place of results) {
            const id = `gmaps-${crypto.createHash('md5').update(place.name).digest('hex').substring(0, 10)}`;
            const realAddress = place.address || `${place.name}, ${city}`;

            // Actual data from extraction
            const rating = place.rating || 'N/A';
            const priceRange = place.priceRange || 'N/A';

            // Pass the raw category to the AI ranker via the features array
            const featuresArray = ['Scraped from Maps'];
            if (place.rawCategory) {
                featuresArray.push(`Actual Map Type: ${place.rawCategory}`);
            }
            const mockFeatures = JSON.stringify(featuresArray);

            // Phase 13 stringification
            const stringifiedReviews = JSON.stringify(place.reviews || []);

            // Extract lat/lng from the URL if possible
            let lat = null, lon = null;
            const coordMatch = place.url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (coordMatch) {
                lat = parseFloat(coordMatch[1]);
                lon = parseFloat(coordMatch[2]);
            }

            try {
                await db.run(`
                    INSERT OR REPLACE INTO places 
                    (id, name, category, address, city, rating, priceRange, features, reviews, lat, lon) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [id, place.name, category, realAddress, city, rating, priceRange, mockFeatures, stringifiedReviews, lat, lon]);

                insertedCount++;
                console.log(` ✅ Saved: ${place.name} ${lat ? `(${lat}, ${lon})` : ''}`);
            } catch (err) {
                console.error(` ❌ Failed to save ${place.name}:`, err.message);
            }
        }

        console.log(`\n🎉 Scraper finished! Saved ${insertedCount} locations to custom database.`);
        return true;

    } catch (error) {
        console.error('Fatal Web Scraping Error:', error);
        throw error; // Let the calling API route handle the error state
    } finally {
        if (browser) await browser.close();
    }
}
// Allow running from CLI directly: node src/scripts/scraper.js "cafe in bhubaneswar" cafe bhubaneswar
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.log("Usage: node scraper.js <search_query> <category> <city> [lat] [lng]");
        console.log('Example: node scraper.js "best cafe" cafe patia 20.2961 85.8245');
        process.exit(1);
    }

    const loc = (args[3] && args[4]) ? { lat: args[3], lng: args[4] } : null;

    scrapeGoogleMaps(args[0], args[1], args[2], loc).then(() => {
        console.log("Database connection closed.");
        process.exit(0);
    });
}

module.exports = scrapeGoogleMaps;
