const { Router } = require('express');
const { getCategories } = require('../controllers/categories.controller');

const router = Router();

router.get('/', getCategories);

module.exports = router;
