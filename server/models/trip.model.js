'use strict';
const { getDb } = require('../db/connect');
const { FieldValue } = require('firebase-admin/firestore');

const db = () => getDb();

const Trip = {
  async create({ user_id, destination_name, destination_lat, destination_lng, start_date, end_date,
           travelers_count, travelers_type, trip_type, budget_min, budget_max, generated_plan }) {
    
    const docRef = await db().collection('trips').add({
      user_id: user_id || null,
      destination_name,
      destination_lat,
      destination_lng,
      start_date,
      end_date,
      travelers_count,
      travelers_type,
      trip_type,
      budget_min,
      budget_max,
      generated_plan: typeof generated_plan === 'string' ? JSON.parse(generated_plan || '{}') : (generated_plan || {}),
      status: 'active',
      created_at: FieldValue.serverTimestamp()
    });
    
    return { id: docRef.id };
  },

  async findById(id) {
    const doc = await db().collection('trips').doc(id).get();
    if (!doc.exists) return null;
    const trip = doc.data();
    return { 
      id: doc.id, 
      ...trip, 
      generated_plan: typeof trip.generated_plan === 'string' ? JSON.parse(trip.generated_plan || '{}') : (trip.generated_plan || {})
    };
  },

  async findRecent(limitCount = 10) {
    const snapshot = await db().collection('trips')
      .orderBy('created_at', 'desc')
      .limit(limitCount)
      .get();
      
    let results = [];
    snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
    return results;
  },
};

module.exports = Trip;
