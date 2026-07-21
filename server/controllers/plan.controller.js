'use strict';
const { discoverDestination } = require('../services/destination.service');
const { getNearbyPlaces } = require('../services/places.service');
const { getRoutes } = require('../services/routing.service');
const { getWeather } = require('../services/weather.service');
const { generateTripPlan, checkTripFeasibility } = require('../services/gemini.service');
const { validateAndMerge } = require('../services/aiValidator.service');
const Trip = require('../models/trip.model');

/**
 * POST /api/plan
 * Orchestrates the full trip planning flow:
 * destination → places → routes → weather → feasibility → Gemini → validate → save → return
 */
async function planTrip(req, res, next) {
  try {
    const {
      destination: destQuery,
      origin = '',
      startDate,
      endDate,
      travelersCount = 1,
      travelersType = 'solo',
      tripType = 'adventure',
      budgetMin = 0,
      budgetMax = 30000,
    } = req.body;

    console.log(`[Plan] Planning trip to: ${destQuery}`);

    // ── Step 1: Discover destination ──────────────────────────────────────
    const destination = await discoverDestination(destQuery);
    console.log(`[Plan] Destination: ${destination.name} (${destination.source}), [${destination.lat}, ${destination.lng}]`);

    // ── Step 2: Parallel real-data fetches ────────────────────────────────
    console.log('[Plan] Fetching places, routes & weather in parallel...');
    const [places, routes, weather] = await Promise.all([
      getNearbyPlaces(destination.lat, destination.lng),
      origin ? getRoutes(origin, destination.lat, destination.lng) : Promise.resolve({ modes: [], distanceKm: null }),
      getWeather(destination.lat, destination.lng, startDate, endDate),
    ]);

    console.log(`[Plan] Found ${places.attractions.length} attractions, ${places.hotels.length} hotels, ${places.restaurants.length} restaurants`);

    const userPrefs = { startDate, endDate, travelersCount, travelersType, tripType, budgetMin, budgetMax, origin };

    // ── Step 3: Feasibility Check ─────────────────────────────────────────
    console.log('[Plan] Checking budget feasibility...');
    const feasibility = await checkTripFeasibility({ destination, routes, userPrefs });
    
    if (!feasibility.isAffordable) {
      console.log(`[Plan] Trip unaffordable. Shortfall: ₹${feasibility.shortfall}`);
      return res.json({
        success: false,
        unaffordable: true,
        feasibility
      });
    }

    // ── Step 4: Gemini AI plan generation ────────────────────────────────
    console.log('[Plan] Trip is affordable. Generating AI plan with Gemini...');
    const aiPlan = await generateTripPlan({ destination, places, routes, weather, userPrefs });

    // ── Step 4: Validate & merge real data ────────────────────────────────
    const finalPlan = validateAndMerge(aiPlan, { destination, places, routes, weather });

    // ── Step 5: Save trip to DB ───────────────────────────────────────────
    let tripId = null;
    try {
      const saved = Trip.create({
        user_id: req.user ? req.user.uid : null,
        destination_name: destination.name,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        start_date: startDate,
        end_date: endDate,
        travelers_count: travelersCount,
        travelers_type: travelersType,
        trip_type: tripType,
        budget_min: budgetMin,
        budget_max: budgetMax,
        generated_plan: finalPlan,
      });
      tripId = saved.id;
    } catch (e) {
      console.warn('[Plan] Could not save trip to DB:', e.message);
    }

    // ── Step 6: Return ────────────────────────────────────────────────────
    return res.json({
      success: true,
      tripId,
      destination: {
        name: destination.name,
        state: destination.state,
        country: destination.country,
        lat: destination.lat,
        lng: destination.lng,
        type: destination.type,
        source: destination.source,
      },
      plan: finalPlan,
    });
  } catch (err) {
    console.error('[Plan] Error:', err.message);
    next(err);
  }
}

module.exports = { planTrip };
