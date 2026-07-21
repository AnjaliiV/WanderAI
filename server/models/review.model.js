'use strict';
const { getDb } = require('../db/connect');

const db = () => getDb();

const Review = {
  findByDestination(destinationId, limit = 20) {
    return db().prepare(`
      SELECT * FROM reviews
      WHERE destination_id = ?
      ORDER BY helpful DESC, created_at DESC
      LIMIT ?
    `).all(destinationId, limit);
  },

  findRecent(limit = 10) {
    return db().prepare(`
      SELECT r.*, d.name AS destination_name, d.slug AS destination_slug
      FROM reviews r
      LEFT JOIN destinations d ON r.destination_id = d.id
      ORDER BY r.created_at DESC
      LIMIT ?
    `).all(limit);
  },

  create({ user_id, destination_id, author_name, rating, title, body, tags,
           accommodation_name, accommodation_type, accommodation_rating, accommodation_link }) {
    const result = db().prepare(`
      INSERT INTO reviews
      (user_id, destination_id, author_name, rating, title, body, tags,
       accommodation_name, accommodation_type, accommodation_rating, accommodation_link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user_id || null, destination_id, author_name, rating, title, body,
      JSON.stringify(tags || []),
      accommodation_name || null, accommodation_type || null,
      accommodation_rating || null, accommodation_link || null
    );
    return { id: result.lastInsertRowid };
  },

  markHelpful(id) {
    db().prepare('UPDATE reviews SET helpful = helpful + 1 WHERE id = ?').run(id);
  },
};

module.exports = Review;
