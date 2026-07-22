'use strict';
const Destination = require('../models/destination.model');

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const HEADERS = { 'User-Agent': 'AiTripPlanner/1.0 (travel-planning-app)' };

/**
 * Discovers a destination: checks DB first, falls back to Nominatim geocoding.
 */
async function discoverDestination(query) {
  // 1. DB lookup
  const slug = slugify(query);
  let dest = await Destination.findBySlug(slug);

  if (!dest) {
    // Try partial name match
    const results = await Destination.search(query, 1);
    if (results.length > 0) dest = await Destination.findById(results[0].id);
  }

  if (dest) {
    return { ...Destination.parseJson(dest), source: 'database' };
  }

  // 2. Nominatim geocoding fallback (restricted to India)
  const geocoded = await geocodeWithNominatim(query);
  if (!geocoded) {
    throw new Error('WanderAI currently supports travel destinations within India only. Please enter an Indian destination.');
  }

  return geocoded;
}

async function geocodeWithNominatim(query) {
  try {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&accept-language=en&countrycodes=in`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error('Nominatim request failed');

    const data = await res.json();
    if (!data || data.length === 0) return null;

    const place = data[0];
    
    // Extra safety check in case Nominatim ignores the parameter for some edge cases
    if (place.address?.country_code !== 'in') {
      return null;
    }
    const addr = place.address || {};

    return {
      name: place.display_name.split(',')[0].trim(),
      slug: slugify(query),
      country: addr.country || 'India',
      state: addr.state || addr.province || '',
      region: addr.state || '',
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      type: inferType(place.type, place.class),
      tags: [],
      best_months: [],
      language: '',
      currency: addr.country_code === 'in' ? 'INR' : '',
      timezone: 'Asia/Kolkata',
      emergency_police: '100',
      emergency_ambulance: '108',
      emergency_tourist: '1800-11-1363',
      overview: '',
      highlights: [],
      hidden_gems: [],
      local_phrases: {},
      source: 'geocoded',
    };
  } catch (err) {
    console.error('[DestinationService] Nominatim error:', err.message);
    return null;
  }
}

function inferType(osmType, osmClass) {
  const map = {
    peak: 'mountain', mountain: 'mountain', hill: 'mountain',
    village: 'village', hamlet: 'village',
    beach: 'beach', bay: 'beach',
    city: 'city', town: 'city',
    island: 'island',
    valley: 'valley',
    lake: 'lake',
  };
  return map[osmType] || map[osmClass] || 'destination';
}

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

module.exports = { discoverDestination };
