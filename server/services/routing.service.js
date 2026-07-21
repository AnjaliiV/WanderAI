'use strict';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const HEADERS = { 'User-Agent': 'AiTripPlanner/1.0' };

/**
 * Estimates travel routes between origin city and destination.
 * Returns driving, and also constructs train/bus estimates from distance.
 */
async function getRoutes(originQuery, destLat, destLng) {
  try {
    // Geocode origin
    const originCoords = await geocodePlace(originQuery);
    if (!originCoords) return buildFallbackRoutes(destLat, destLng);

    // Get road route via OSRM
    const url = `${OSRM_BASE}/driving/${originCoords.lng},${originCoords.lat};${destLng},${destLat}?overview=false&alternatives=false`;
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });

    let distanceKm = null;
    let driveTimeH = null;

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        distanceKm = Math.round(data.routes[0].distance / 1000);
        driveTimeH = Math.round(data.routes[0].duration / 3600 * 10) / 10;
      }
    }

    if (!distanceKm) return buildFallbackRoutes(destLat, destLng);

    return buildTransportOptions(distanceKm, driveTimeH);
  } catch (err) {
    console.error('[RoutingService]', err.message);
    return buildFallbackRoutes(destLat, destLng);
  }
}

async function geocodePlace(query) {
  try {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { return null; }
}

function buildTransportOptions(distanceKm, driveTimeH) {
  const modes = [];

  // Driving / Road
  modes.push({
    mode: 'road',
    label: 'Road / Car',
    icon: '🚗',
    distanceKm,
    durationH: driveTimeH,
    durationText: formatDuration(driveTimeH),
    estimatedCostINR: estimateFuelCost(distanceKm),
    notes: `Via highway/NH. Fuel cost estimate for a sedan (₹10/km approx).`,
    steps: [],
  });

  // Train estimate (slightly longer than road due to route detours)
  const trainTimeH = Math.round(distanceKm / 80 * 10) / 10;
  if (distanceKm > 50) {
    modes.push({
      mode: 'train',
      label: 'Train',
      icon: '🚂',
      distanceKm: Math.round(distanceKm * 1.15),
      durationH: trainTimeH,
      durationText: formatDuration(trainTimeH),
      estimatedCostINR: estimateTrainCost(distanceKm),
      notes: `Check Indian Railways (irctc.co.in) for actual schedules. Sleeper class most affordable. Book 2-3 weeks in advance.`,
      steps: [],
    });
  }

  // Bus
  const busTimeH = Math.round(distanceKm / 55 * 10) / 10;
  if (distanceKm > 20) {
    modes.push({
      mode: 'bus',
      label: 'Bus',
      icon: '🚌',
      distanceKm,
      durationH: busTimeH,
      durationText: formatDuration(busTimeH),
      estimatedCostINR: estimateBusCost(distanceKm),
      notes: `State buses available. HRTC (Himachal), KSRTC (Karnataka/Kerala), MSRTC (Maharashtra) etc. Check redbus.in for private operators.`,
      steps: [],
    });
  }

  // Flight (for long distances)
  if (distanceKm > 400) {
    modes.push({
      mode: 'flight',
      label: 'Flight',
      icon: '✈️',
      distanceKm,
      durationH: Math.round(distanceKm / 700 + 1.5),
      durationText: `${Math.round(distanceKm / 700 + 1.5)}h (incl. check-in)`,
      estimatedCostINR: estimateFlightCost(distanceKm),
      notes: `Book via makemytrip.com or ixigo.com. Prices vary significantly. Budget airlines like IndiGo, SpiceJet recommended for best fares.`,
      steps: [],
    });
  }

  return { distanceKm, modes, origin: null };
}

function buildFallbackRoutes(destLat, destLng) {
  return {
    distanceKm: null,
    modes: [
      {
        mode: 'road', label: 'Road / Car', icon: '🚗',
        durationText: 'Varies by origin', estimatedCostINR: null,
        notes: 'Enter your origin city for accurate estimates.',
      },
      {
        mode: 'train', label: 'Train', icon: '🚂',
        durationText: 'Check IRCTC', estimatedCostINR: null,
        notes: 'Book on irctc.co.in',
      },
    ],
  };
}

function estimateFuelCost(km) {
  const ratePerKm = 10;
  return { min: Math.round(km * ratePerKm * 0.8), max: Math.round(km * ratePerKm * 1.2), note: 'one-way, sedan' };
}
function estimateTrainCost(km) {
  const base = km * 0.5;
  return { min: Math.round(base * 0.5), max: Math.round(base * 3), note: 'sleeper to 3A' };
}
function estimateBusCost(km) {
  return { min: Math.round(km * 0.4), max: Math.round(km * 1.2), note: 'state to luxury' };
}
function estimateFlightCost(km) {
  return { min: 2500, max: 12000, note: 'budget to premium, one-way' };
}

function formatDuration(hours) {
  if (!hours) return 'Unknown';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

module.exports = { getRoutes };
