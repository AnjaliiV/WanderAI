'use strict';
const Destination = require('../models/destination.model');
const { discoverDestination } = require('../services/destination.service');

async function search(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) return res.json({ results: [] });

    // DB search first
    const dbResults = await Destination.search(q, 8);
    if (dbResults.length > 0) {
      return res.json({
        results: dbResults.map(d => ({
          name: d.name, slug: d.slug, state: d.state,
          country: d.country, type: d.type, source: 'database',
        })),
      });
    }

    // Nominatim fallback for autocomplete (restricted to India)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&accept-language=en&countrycodes=in`;
    const nominatimRes = await fetch(url, {
      headers: { 'User-Agent': 'AiTripPlanner/1.0' },
      signal: AbortSignal.timeout(6000),
    });

    if (!nominatimRes.ok) return res.json({ results: [] });
    const data = await nominatimRes.json();

    const results = data.map(place => ({
      name: place.display_name.split(',')[0].trim(),
      state: place.address?.state || '',
      country: place.address?.country || '',
      type: place.type || place.class || 'place',
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      source: 'geocoded',
    }));

    return res.json({ results });
  } catch (err) {
    next(err);
  }
}

async function getFeatured(req, res, next) {
  try {
    const featured = await Destination.findFeatured(9);
    const destinations = featured.map(d => Destination.parseJson(d));
    res.json({ destinations });
  } catch (err) { next(err); }
}

async function getAll(req, res, next) {
  try {
    const { type, state } = req.query;
    const allDests = await Destination.findAll({ type, state }, 30);
    const destinations = allDests.map(d => Destination.parseJson(d));
    res.json({ destinations });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const dest = await Destination.findBySlug(req.params.slug);
    if (!dest) return res.status(404).json({ error: 'Destination not found' });
    res.json({ destination: Destination.parseJson(dest) });
  } catch (err) { next(err); }
}

module.exports = { search, getFeatured, getAll, getOne };
