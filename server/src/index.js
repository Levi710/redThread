require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const rateLimiter = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const searchRoutes = require('./routes/search.routes');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
}));

// Parsers
app.use(express.json());
app.use(requestLogger);

// Root Health Check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'RedThread API Server is active',
        version: '1.0.0',
        endpoints: {
            search: '/api/search',
            health: '/api/health'
        }
    });
});

const path = require('path');

// Routes
app.use('/api/search', searchRoutes);
app.use(rateLimiter);

app.use('/api', routes);

// Serve Static Files for Deployment
const clientPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientPath));

// Handle React SPA routing
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientPath, 'index.html'));
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

app.listen(config.port, () => {
    logger.info(`RedThread server running on port ${config.port}`, {
        env: config.env,
        groqConfigured: !!config.groqApiKey,
        endpoints: ['/api/health', '/api/search', '/api/categories', '/api/suggestions'],
    });
});

module.exports = app;

// Trigger restart
