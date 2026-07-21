'use strict';
const rateLimit = require('express-rate-limit');

const planLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 5,                   // 5 plan requests per minute per IP
  message: { error: 'Too many plan requests. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many search requests.' },
});

const reviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many review submissions.' },
});

module.exports = { planLimiter, searchLimiter, reviewLimiter };
