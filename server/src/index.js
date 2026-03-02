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
const path = require('path');

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

// Serve Static Files for Deployment
const clientPath = path.join(__dirname, '../../client/out');
app.use(express.static(clientPath));

// API Routes
app.use('/api/search', searchRoutes);
app.use(rateLimiter);
app.use('/api', routes);

// Handle React SPA routing (Matches everything not caught by API/Statics)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientPath, 'index.html'));
});

// Final Error Handling
app.use(errorHandler);

const port = config.port || 7860;
app.listen(port, '0.0.0.0', () => {
    logger.info(`RedThread server is live at 0.0.0.0:${port}`, {
        mode: config.env,
        clientPath: clientPath,
        groq: !!config.groqApiKey
    });
});

module.exports = app;

// Trigger restart
