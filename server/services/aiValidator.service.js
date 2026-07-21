'use strict';

/**
 * Validates and sanitizes Gemini AI responses.
 * Merges verified real data back in, strips any invented facts.
 */
function validateAndMerge(aiPlan, { destination, places, routes, weather }) {
  if (!aiPlan || typeof aiPlan !== 'object') {
    throw new Error('Invalid AI plan structure');
  }

  // 1. Override emergency numbers with verified DB data (never trust AI here)
  if (aiPlan.safetyInfo?.emergencyNumbers) {
    aiPlan.safetyInfo.emergencyNumbers = {
      police: destination.emergency_police || '100',
      ambulance: destination.emergency_ambulance || '108',
      tourist_helpline: destination.emergency_tourist || '1800-11-1363',
    };
  }

  // 2. Attach real coordinates to scenic spots
  if (aiPlan.scenicSpots && places.scenicSpots) {
    aiPlan.scenicSpots = aiPlan.scenicSpots.map(spot => {
      const real = places.scenicSpots.find(r =>
        r.name.toLowerCase().includes(spot.name.toLowerCase().slice(0, 10)) ||
        spot.name.toLowerCase().includes(r.name.toLowerCase().slice(0, 10))
      );
      return {
        ...spot,
        coordinates: real ? { lat: real.lat, lng: real.lng } : null,
        verified: !!real,
      };
    });
  }

  // 3. Attach real coordinates to itinerary places
  const allRealPlaces = [
    ...places.attractions,
    ...places.hotels,
    ...places.restaurants,
    ...places.scenicSpots,
  ];

  if (aiPlan.itinerary) {
    aiPlan.itinerary = aiPlan.itinerary.map(day => ({
      ...day,
      morning: attachCoords(day.morning, allRealPlaces),
      afternoon: attachCoords(day.afternoon, allRealPlaces),
      evening: attachCoords(day.evening, allRealPlaces),
    }));
  }

  // 4. Attach real transport data
  aiPlan.transportData = routes;

  // 5. Attach real weather
  aiPlan.weatherData = weather;

  // 6. Attach full real places for map rendering
  aiPlan.mapData = {
    center: { lat: destination.lat, lng: destination.lng },
    attractions: places.attractions.map(p => ({
      name: p.name, lat: p.lat, lng: p.lng, type: p.type,
    })),
    hotels: places.hotels.map(p => ({
      name: p.name, lat: p.lat, lng: p.lng, type: 'hotel',
    })),
    restaurants: places.restaurants.map(p => ({
      name: p.name, lat: p.lat, lng: p.lng, cuisine: p.cuisine,
    })),
    scenicSpots: places.scenicSpots.map(p => ({
      name: p.name, lat: p.lat, lng: p.lng, type: 'scenic',
    })),
  };

  // 7. Ensure budget total is consistent
  if (aiPlan.budgetBreakdown) {
    const bd = aiPlan.budgetBreakdown;
    const sum = (bd.accommodation || 0) + (bd.food || 0) + (bd.transport || 0)
              + (bd.activities || 0) + (bd.miscellaneous || 0);
    if (sum > 0 && Math.abs(sum - (bd.total || 0)) > 100) {
      bd.total = sum;
    }
    if (bd.total && !bd.perPerson) {
      bd.perPerson = Math.round(bd.total);
    }
  }

  return aiPlan;
}

function attachCoords(slot, realPlaces) {
  if (!slot || !slot.place) return slot;
  const match = realPlaces.find(p =>
    p.name && (
      p.name.toLowerCase().includes(slot.place.toLowerCase().slice(0, 8)) ||
      slot.place.toLowerCase().includes(p.name.toLowerCase().slice(0, 8))
    )
  );
  return { ...slot, coordinates: match ? { lat: match.lat, lng: match.lng } : null };
}

module.exports = { validateAndMerge };
