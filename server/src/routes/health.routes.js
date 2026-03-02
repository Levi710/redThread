const { Router } = require('express');
const { getHealth, getCacheStats, clearCache } = require('../controllers/health.controller');

const router = Router();

router.get('/', getHealth);
router.get('/cache', getCacheStats);
router.delete('/cache', clearCache);

module.exports = router;
