const { Router } = require('express');
const { handleSearch } = require('../controllers/search.controller');
const { validateSearchBody } = require('../validators/search.validator');
const safetyGuard = require('../middleware/safetyGuard');

const router = Router();

router.post('/', validateSearchBody, safetyGuard, handleSearch);

module.exports = router;
