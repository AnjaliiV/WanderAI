'use strict';
const Review = require('../models/review.model');
const Destination = require('../models/destination.model');

async function getRecentReviews(req, res, next) {
  try {
    const reviews = Review.findRecent(12);
    res.json({ reviews });
  } catch (err) { next(err); }
}

async function getReviewsByDestination(req, res, next) {
  try {
    const dest = Destination.findBySlug(req.params.slug);
    if (!dest) return res.status(404).json({ error: 'Destination not found' });
    const reviews = Review.findByDestination(dest.id, 20);
    res.json({ reviews });
  } catch (err) { next(err); }
}

async function createReview(req, res, next) {
  try {
    const {
      destinationId, authorName, rating, title, body, tags,
      accommodationName, accommodationType, accommodationRating, accommodationLink,
    } = req.body;

    const result = Review.create({
      user_id: req.user ? req.user.uid : null,
      destination_id: destinationId,
      author_name: authorName,
      rating,
      title,
      body,
      tags,
      accommodation_name: accommodationName,
      accommodation_type: accommodationType,
      accommodation_rating: accommodationRating,
      accommodation_link: accommodationLink,
    });

    res.status(201).json({ success: true, reviewId: result.id });
  } catch (err) { next(err); }
}

async function markHelpful(req, res, next) {
  try {
    Review.markHelpful(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { getRecentReviews, getReviewsByDestination, createReview, markHelpful };
