const config = {
    port: parseInt(process.env.PORT, 10) || 3001,
    env: process.env.NODE_ENV || 'development',
    groqApiKey: process.env.GROQ_API_KEY || '',
    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100,
    },
};

module.exports = config;
