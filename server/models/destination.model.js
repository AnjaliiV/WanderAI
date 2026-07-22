'use strict';
const { getDb } = require('../db/connect');

const db = () => getDb();

const Destination = {
  async findBySlug(slug) {
    const snapshot = await db().collection('destinations').where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  },

  async search(query, limit = 8) {
    // Firestore does not natively support full-text search or 'LIKE' operators.
    // For a simple migration, we'll fetch all destinations and filter in memory since the dataset is small.
    // In a real prod app, use Algolia or Typesense with Firestore.
    const snapshot = await db().collection('destinations').get();
    const q = query.toLowerCase();
    
    let results = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if ((data.name && data.name.toLowerCase().includes(q)) || 
          (data.state && data.state.toLowerCase().includes(q)) || 
          (data.region && data.region.toLowerCase().includes(q))) {
        results.push({ id: doc.id, ...data });
      }
    });

    results.sort((a, b) => (b.featured || 0) - (a.featured || 0));
    return results.slice(0, limit);
  },

  async findFeatured(limitCount = 8) {
    const snapshot = await db().collection('destinations')
      .where('featured', '==', 1)
      .get();
      
    let results = [];
    snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
    results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return results.slice(0, limitCount);
  },

  async findAll(filters = {}, limitCount = 20) {
    let queryRef = db().collection('destinations');
    
    if (filters.type) {
      queryRef = queryRef.where('type', '==', filters.type);
    }
    
    const snapshot = await queryRef.get();
    
    let results = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (filters.state && !data.state?.toLowerCase().includes(filters.state.toLowerCase())) {
        return; // skip
      }
      results.push({ id: doc.id, ...data });
    });
    
    results.sort((a, b) => (b.featured || 0) - (a.featured || 0) || (a.name || '').localeCompare(b.name || ''));
    return results.slice(0, limitCount);
  },

  async findById(id) {
    const doc = await db().collection('destinations').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  parseJson(dest) {
    if (!dest) return null;
    return {
      ...dest,
      // Firestore already parses JSON objects if we store them as arrays/objects!
      // But we will gracefully handle strings if they are still strings.
      tags: typeof dest.tags === 'string' ? JSON.parse(dest.tags || '[]') : (dest.tags || []),
      best_months: typeof dest.best_months === 'string' ? JSON.parse(dest.best_months || '[]') : (dest.best_months || []),
      highlights: typeof dest.highlights === 'string' ? JSON.parse(dest.highlights || '[]') : (dest.highlights || []),
      hidden_gems: typeof dest.hidden_gems === 'string' ? JSON.parse(dest.hidden_gems || '[]') : (dest.hidden_gems || []),
      local_phrases: typeof dest.local_phrases === 'string' ? JSON.parse(dest.local_phrases || '{}') : (dest.local_phrases || {}),
    };
  },
};

module.exports = Destination;
