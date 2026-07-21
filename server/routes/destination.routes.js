'use strict';
const express = require('express');
const router = express.Router();
const { getFeatured, getAll, getOne } = require('../controllers/search.controller');

router.get('/', getAll);
router.get('/featured', getFeatured);
router.get('/:slug', getOne);

module.exports = router;
