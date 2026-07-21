'use strict';
const { getDb } = require('../db/connect');
const { FieldValue } = require('firebase-admin/firestore');

const db = () => getDb();

const Review = {
  async findByDestination(destinationId, limitCount = 20) {
    const snapshot = await db().collection('reviews')
      .where('destination_id', '==', destinationId)
      .orderBy('helpful', 'desc')
      .orderBy('created_at', 'desc')
      .limit(limitCount)
      .get();
      
    let results = [];
    snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
    return results;
  },

  async findRecent(limitCount = 10) {
    const snapshot = await db().collection('reviews')
      .orderBy('created_at', 'desc')
      .limit(limitCount)
      .get();
      
    let results = [];
    snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
    return results;
  },

  async create({ user_id, destination_id, author_name, rating, title, body, tags,
           accommodation_name, accommodation_type, accommodation_rating, accommodation_link,
           destination_name, destination_slug }) {
             
    // Note: We denormalize destination_name and destination_slug because Firestore doesn't do JOINs.
    const docRef = await db().collection('reviews').add({
      user_id: user_id || null,
      destination_id,
      destination_name: destination_name || null,
      destination_slug: destination_slug || null,
      author_name,
      rating,
      title,
      body,
      tags: typeof tags === 'string' ? JSON.parse(tags || '[]') : (tags || []),
      accommodation_name: accommodation_name || null,
      accommodation_type: accommodation_type || null,
      accommodation_rating: accommodation_rating || null,
      accommodation_link: accommodation_link || null,
      helpful: 0,
      created_at: FieldValue.serverTimestamp()
    });
    
    return { id: docRef.id };
  },

  async markHelpful(id) {
    await db().collection('reviews').doc(id).update({
      helpful: FieldValue.increment(1)
    });
  },
};

module.exports = Review;
