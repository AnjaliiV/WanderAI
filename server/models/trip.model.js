'use strict';
const { getDb } = require('../db/connect');

const db = () => getDb();

const Trip = {
  create({ user_id, destination_name, destination_lat, destination_lng, start_date, end_date,
           travelers_count, travelers_type, trip_type, budget_min, budget_max, generated_plan }) {
    const result = db().prepare(`
      INSERT INTO trips
      (user_id, destination_name, destination_lat, destination_lng, start_date, end_date,
       travelers_count, travelers_type, trip_type, budget_min, budget_max, generated_plan, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(
      user_id || null, destination_name, destination_lat, destination_lng, start_date, end_date,
      travelers_count, travelers_type, trip_type, budget_min, budget_max,
      JSON.stringify(generated_plan || {})
    );
    return { id: result.lastInsertRowid };
  },

  findById(id) {
    const trip = db().prepare('SELECT * FROM trips WHERE id = ?').get(id);
    if (!trip) return null;
    return { ...trip, generated_plan: JSON.parse(trip.generated_plan || '{}') };
  },

  findRecent(limit = 10) {
    return db().prepare('SELECT * FROM trips ORDER BY created_at DESC LIMIT ?').all(limit);
  },
};

module.exports = Trip;
