'use strict';
const { getDb } = require('../db/connect');

const db = () => getDb();

const Destination = {
  findBySlug(slug) {
    return db().prepare('SELECT * FROM destinations WHERE slug = ?').get(slug);
  },

  search(query, limit = 8) {
    const q = `%${query}%`;
    return db().prepare(`
      SELECT id, name, slug, state, country, type, lat, lng, featured
      FROM destinations
      WHERE name LIKE ? OR state LIKE ? OR region LIKE ?
      ORDER BY featured DESC, name ASC
      LIMIT ?
    `).all(q, q, q, limit);
  },

  findFeatured(limit = 8) {
    return db().prepare(`
      SELECT * FROM destinations WHERE featured = 1 ORDER BY name ASC LIMIT ?
    `).all(limit);
  },

  findAll(filters = {}, limit = 20) {
    let sql = 'SELECT * FROM destinations WHERE 1=1';
    const params = [];
    if (filters.type) { sql += ' AND type = ?'; params.push(filters.type); }
    if (filters.state) { sql += ' AND state LIKE ?'; params.push(`%${filters.state}%`); }
    sql += ' ORDER BY featured DESC, name ASC LIMIT ?';
    params.push(limit);
    return db().prepare(sql).all(...params);
  },

  findById(id) {
    return db().prepare('SELECT * FROM destinations WHERE id = ?').get(id);
  },

  parseJson(dest) {
    if (!dest) return null;
    return {
      ...dest,
      tags: JSON.parse(dest.tags || '[]'),
      best_months: JSON.parse(dest.best_months || '[]'),
      highlights: JSON.parse(dest.highlights || '[]'),
      hidden_gems: JSON.parse(dest.hidden_gems || '[]'),
      local_phrases: JSON.parse(dest.local_phrases || '{}'),
    };
  },
};

module.exports = Destination;
