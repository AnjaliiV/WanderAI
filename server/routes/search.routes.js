'use strict';
const express = require('express');
const router = express.Router();
const { search } = require('../controllers/search.controller');
const { searchLimiter } = require('../middleware/rateLimiter');
const { searchValidation, validate } = require('../middleware/validator');

router.get('/', searchLimiter, searchValidation, validate, search);

module.exports = router;
