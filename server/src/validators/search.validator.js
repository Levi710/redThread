const AppError = require('../utils/AppError');

function validateSearchBody(req, res, next) {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
        return next(new AppError('Field "query" is required and must be a string.', 400));
    }

    const trimmed = query.trim();
    if (trimmed.length < 3) {
        return next(new AppError('Query must be at least 3 characters.', 400));
    }

    if (trimmed.length > 500) {
        return next(new AppError('Query must not exceed 500 characters.', 400));
    }

    req.body.query = trimmed;
    next();
}

module.exports = { validateSearchBody };
