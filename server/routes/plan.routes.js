'use strict';
const express = require('express');
const router = express.Router();
const { planTrip } = require('../controllers/plan.controller');
const { planLimiter } = require('../middleware/rateLimiter');
const { planValidation, validate } = require('../middleware/validator');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/', requireAuth, planLimiter, planValidation, validate, planTrip);

module.exports = router;
