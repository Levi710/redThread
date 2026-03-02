const BLOCKED_PATTERNS = [
    /hack/i, /exploit/i, /steal/i, /phish/i, /crack\s*password/i,
    /porn/i, /xxx/i, /nsfw/i, /18\+/i, /adult\s*content/i,
    /drug\s*dealer/i, /buy\s*drugs/i, /illegal/i, /counterfeit/i,
    /doxx/i, /stalk/i, /spy\s*on/i, /track\s*someone/i,
    /bomb/i, /weapon/i, /gun\s*shop\s*illegal/i,
    /scrape\s*facebook/i, /scrape\s*instagram/i, /scrape\s*private/i,
];

const BLOCKED_TARGETS = [
    'facebook.com', 'instagram.com', 'twitter.com',
    'linkedin.com', 'bank', 'government',
];

function validate(query) {
    const lower = query.toLowerCase().trim();

    if (!lower || lower.length < 3) {
        return { safe: false, reason: 'Query too short or empty.' };
    }

    if (lower.length > 500) {
        return { safe: false, reason: 'Query exceeds maximum length.' };
    }

    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(lower)) {
            return {
                safe: false,
                reason: 'Query blocked by safety filter. This platform does not support harmful, illegal, or adult content searches.',
            };
        }
    }

    for (const target of BLOCKED_TARGETS) {
        if (lower.includes(target)) {
            return {
                safe: false,
                reason: `Scraping ${target} is not allowed. Please use publicly available sources.`,
            };
        }
    }

    return { safe: true };
}

module.exports = { validate };
