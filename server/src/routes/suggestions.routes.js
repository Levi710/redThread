const { Router } = require('express');
const { getSuggestions, getPlaceById } = require('../controllers/suggestions.controller');
const safetyGuard = require('../middleware/safetyGuard');

const router = Router();

router.get('/', safetyGuard, getSuggestions);
router.get('/:id', getPlaceById);

module.exports = router;
