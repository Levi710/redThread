const { Router } = require('express');
const healthRoutes = require('./health.routes');
const searchRoutes = require('./search.routes');
const categoriesRoutes = require('./categories.routes');
const suggestionsRoutes = require('./suggestions.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/search', searchRoutes);
router.use('/categories', categoriesRoutes);
router.use('/suggestions', suggestionsRoutes);

module.exports = router;
