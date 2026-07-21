'use strict';
const express = require('express');
const router = express.Router();
const { getRecentReviews, getReviewsByDestination, createReview, markHelpful } = require('../controllers/review.controller');
const { reviewLimiter } = require('../middleware/rateLimiter');
const { reviewValidation, validate } = require('../middleware/validator');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', getRecentReviews);
router.get('/destination/:slug', getReviewsByDestination);
router.post('/', requireAuth, reviewLimiter, reviewValidation, validate, createReview);
router.post('/:id/helpful', reviewLimiter, markHelpful);

module.exports = router;
