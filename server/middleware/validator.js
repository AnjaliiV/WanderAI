'use strict';
const { body, query, validationResult } = require('express-validator');

const planValidation = [
  body('destination').trim().notEmpty().withMessage('Destination is required').isLength({ max: 100 }),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('travelersCount').optional().isInt({ min: 1, max: 20 }).toInt(),
  body('travelersType').optional().isIn(['solo', 'couple', 'group', 'family']),
  body('tripType').optional().isIn(['adventure', 'relaxation', 'cultural', 'food', 'budget', 'luxury', 'spiritual', 'wildlife']),
  body('budgetMin').optional().isInt({ min: 0 }).toInt(),
  body('budgetMax').optional().isInt({ min: 0 }).toInt(),
  body('origin').optional().trim().isLength({ max: 100 }),
];

const reviewValidation = [
  body('destinationId').notEmpty().withMessage('Destination ID required'),
  body('authorName').trim().notEmpty().isLength({ max: 80 }),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('title').trim().notEmpty().isLength({ max: 120 }),
  body('body').trim().notEmpty().isLength({ min: 10, max: 2000 }),
];

const searchValidation = [
  query('q').trim().notEmpty().isLength({ max: 100 }),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = { planValidation, reviewValidation, searchValidation, validate };
