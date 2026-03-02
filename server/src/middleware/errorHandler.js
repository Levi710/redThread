const config = require('../config');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';

    logger.error(err.message, {
        statusCode,
        path: req.path,
        method: req.method,
        stack: config.env === 'development' ? err.stack : undefined,
    });

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(config.env === 'development' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
