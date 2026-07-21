'use strict';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Fetches nearby attractions, hotels, restaurants, and scenic spots
 * for a given lat/lng using the Overpass API (OpenStreetMap data).
 * Returns only real, verified places — never invented.
 */
async function getNearbyPlaces(lat, lng, radiusKm = 15) {
  const radius = radiusKm * 1000; // metres

  const query = `
    [out:json][timeout:25];
    (
      node["tourism"~"attraction|viewpoint|museum|artwork|picnic_site|camp_site|information"](around:${radius},${lat},${lng});
      node["amenity"~"restaurant|cafe|food_court"](around:${radius},${lat},${lng});
      node["tourism"="hotel"](around:${radius},${lat},${lng});
      node["tourism"="hostel"](around:${radius},${lat},${lng});
      node["tourism"="guest_house"](around:${radius},${lat},${lng});
      node["natural"~"peak|waterfall|glacier|beach|bay|cave_entrance"](around:${radius},${lat},${lng});
      node["leisure"~"park|nature_reserve"](around:${radius},${lat},${lng});
      node["historic"~"fort|monument|memorial|ruins|temple"](around:${radius},${lat},${lng});
      node["amenity"="place_of_worship"](around:${radius},${lat},${lng});
    );
    out body 60;
  `;

  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
    const data = await res.json();

    return categorisePlaces(data.elements || []);
  } catch (err) {
    console.error('[PlacesService] Error:', err.message);
    return { attractions: [], hotels: [], restaurants: [], scenicSpots: [] };
  }
}

function categorisePlaces(elements) {
  const attractions = [];
  const hotels = [];
  const restaurants = [];
  const scenicSpots = [];

  for (const el of elements) {
    if (!el.tags || !el.lat || !el.lon) continue;
    const name = el.tags.name || el.tags['name:en'] || null;
    if (!name) continue;

    const item = {
      name,
      lat: el.lat,
      lng: el.lon,
      type: el.tags.tourism || el.tags.amenity || el.tags.natural || el.tags.historic || el.tags.leisure,
      address: [el.tags['addr:street'], el.tags['addr:city']].filter(Boolean).join(', '),
      website: el.tags.website || el.tags['contact:website'] || null,
      phone: el.tags.phone || el.tags['contact:phone'] || null,
      opening_hours: el.tags.opening_hours || null,
      description: el.tags.description || el.tags.note || null,
    };

    const t = el.tags.tourism;
    const a = el.tags.amenity;
    const n = el.tags.natural;
    const h = el.tags.historic;

    if (t === 'hotel' || t === 'hostel' || t === 'guest_house' || t === 'motel') {
      hotels.push({ ...item, stars: el.tags.stars || null });
    } else if (a === 'restaurant' || a === 'cafe' || a === 'food_court') {
      restaurants.push({ ...item, cuisine: el.tags.cuisine || null });
    } else if (t === 'viewpoint' || n === 'peak' || n === 'waterfall' || n === 'glacier' || n === 'beach') {
      scenicSpots.push(item);
      attractions.push(item);
    } else {
      attractions.push(item);
    }
  }

  return {
    attractions: attractions.slice(0, 20),
    hotels: hotels.slice(0, 10),
    restaurants: restaurants.slice(0, 15),
    scenicSpots: scenicSpots.slice(0, 10),
  };
}

module.exports = { getNearbyPlaces };
