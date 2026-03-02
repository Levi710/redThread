const safetyService = require('../services/safety.service');
const AppError = require('../utils/AppError');

const safetyGuard = (req, res, next) => {
    const input = req.body.query || req.query.q;
    if (!input) return next();

    const result = safetyService.validate(input);
    if (!result.safe) {
        return next(new AppError(result.reason, 403));
    }
    next();
};

module.exports = safetyGuard;
