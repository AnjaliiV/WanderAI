'use strict';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

/**
 * Generates a structured trip plan using Gemini.
 * CRITICAL: All factual data is passed in from real APIs.
 * Gemini only personalizes, narrates, and structures — never invents facts.
 */
async function generateTripPlan({ destination, places, routes, weather, userPrefs }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured in .env');

  const days = calculateDays(userPrefs.startDate, userPrefs.endDate);
  const prompt = buildPrompt({ destination, places, routes, weather, userPrefs, days });

  try {
    const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Our AI planner is currently overwhelmed by too many requests (free tier quota exceeded). Please wait a minute and try again!');
      }
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    return JSON.parse(text);
  } catch (err) {
    if (err instanceof SyntaxError) throw new Error('Gemini returned invalid JSON. Retry.');
    throw err;
  }
}

function buildPrompt({ destination, places, routes, weather, userPrefs, days }) {
  const { name, state, country, overview, highlights, hidden_gems, emergency_police,
          emergency_ambulance, emergency_tourist, local_phrases, best_months, currency } = destination;

  const attractionNames = places.attractions.slice(0, 15).map(p => p.name);
  const hotelNames = places.hotels.slice(0, 8).map(p => p.name);
  const restaurantNames = places.restaurants.slice(0, 10).map(p => ({ name: p.name, cuisine: p.cuisine }));
  const scenicSpotNames = places.scenicSpots.slice(0, 8).map(p => p.name);
  
  const tripTypeStr = Array.isArray(userPrefs.tripType) ? userPrefs.tripType.join(' & ') : userPrefs.tripType;

  const transportModes = routes.modes?.map(m =>
    `${m.icon} ${m.label}: ~${m.durationText}, est. ₹${m.estimatedCostINR?.min || '?'}-${m.estimatedCostINR?.max || '?'}`
  ).join('\n') || 'Route data unavailable';

  return `You are an expert travel planner AI. Generate a detailed, personalized trip plan as a JSON object.

## CRITICAL RULES (MUST FOLLOW):
- Use ONLY the verified real data provided below. Do NOT invent, add, or modify any place names, hotel names, restaurant names, phone numbers, or prices.
- If the real data has few places, work with what's provided — do not add fictional alternatives.
- Structure the itinerary using ONLY the attractions listed in REAL_ATTRACTIONS.
- Hotel recommendations must come ONLY from REAL_HOTELS (use generic "local homestay" / "guesthouse" if list is empty).
- Restaurant recommendations must come ONLY from REAL_RESTAURANTS.
- Emergency numbers are provided — do NOT change them.
- NEVER show a total budget that excludes the cost of reaching the destination and returning home. The budget breakdown MUST include round-trip intercity transport based on the provided transport modes.
- WanderAI currently supports travel destinations within India only. Ensure all recommendations, attractions, hotels, restaurants, transport routes, weather, maps, hidden gems, and itineraries remain strictly within India.

## DESTINATION
Name: ${name}
Location: ${state ? state + ', ' : ''}${country}
Type: ${destination.type}
Currency: ${currency || 'INR'}
Best Months to Visit: ${JSON.stringify(best_months)}
Overview: ${overview || 'A beautiful travel destination worth exploring.'}
Database Highlights: ${JSON.stringify(highlights)}
Hidden Gems (from DB): ${JSON.stringify(hidden_gems)}

## USER PREFERENCES & TRANSPORT
Trip Duration: ${days} days
Travelers: ${userPrefs.travelersCount} (${userPrefs.travelersType})
Trip Type: ${userPrefs.tripType}
Budget: ₹${userPrefs.budgetMin} - ₹${userPrefs.budgetMax} total
Start Date: ${userPrefs.startDate || 'flexible'}
Intercity Routes: ${transportModes}

## REAL WEATHER DATA
Current: ${weather.current?.tempC}°C, ${weather.current?.condition}
Season: ${weather.season}
Average Temp: ${weather.avgTempC}°C
Weather-based packing items: ${JSON.stringify(weather.packingAdvice)}

## REAL TRANSPORT OPTIONS (from OSRM routing)
User Origin City: ${userPrefs.origin || 'Not specified'}
Distance: ${routes.distanceKm ? routes.distanceKm + ' km from origin' : 'varies'}
${transportModes}

## REAL ATTRACTIONS (Overpass/OSM verified)
${JSON.stringify(attractionNames)}

## REAL HOTELS / ACCOMMODATION (Overpass/OSM verified)
${JSON.stringify(hotelNames)}

## REAL RESTAURANTS (Overpass/OSM verified)
${JSON.stringify(restaurantNames)}

## REAL SCENIC / PHOTO SPOTS (Overpass/OSM verified)
${JSON.stringify(scenicSpotNames)}

## EMERGENCY NUMBERS (verified, do not change)
Police: ${emergency_police || '100'}
Ambulance: ${emergency_ambulance || '108'}
Tourist Helpline: ${emergency_tourist || '1800-11-1363'}

## LOCAL PHRASES
${JSON.stringify(local_phrases || {})}

## OUTPUT FORMAT
Return a single valid JSON object with this exact structure:
{
  "overview": {
    "description": "2-3 paragraph engaging overview of ${name} for a ${userPrefs.travelersType} ${tripTypeStr} traveler",
    "whyVisit": ["reason1", "reason2", "reason3"],
    "bestTimeToVisit": "when and why (use best_months data)",
    "quickFacts": {
      "language": "...", "currency": "...", "timezone": "...",
      "knownFor": "...", "tripType": "${tripTypeStr}"
    },
    "localTips": ["practical tip 1", "tip 2", "tip 3", "tip 4"]
  },
  "itinerary": [
    {
      "day": 1,
      "theme": "short day theme",
      "morning": { "time": "8:00 AM - 12:00 PM", "activity": "...", "place": "real place from list", "description": "...", "tip": "..." },
      "afternoon": { "time": "12:00 PM - 5:00 PM", "activity": "...", "place": "real place from list", "description": "...", "tip": "..." },
      "evening": { "time": "6:00 PM - 9:00 PM", "activity": "...", "place": "real place from list or area", "description": "...", "tip": "..." }
    }
  ],
  "accommodation": {
    "recommendations": [
      { "name": "from real hotels list or 'local homestay'", "type": "budget|mid|luxury", "pricePerNight": "₹ range", "description": "why suited", "features": [] }
    ],
    "bookingTips": ["tip1", "tip2"]
  },
  "foodGuide": {
    "famousDishes": [
      { "name": "local dish name", "description": "brief", "mustTry": true }
    ],
    "restaurants": [
      { "name": "from real restaurants list", "cuisine": "...", "priceRange": "₹ range", "specialty": "..." }
    ],
    "foodTips": ["tip1", "tip2"]
  },
  "packingList": {
    "clothing": [],
    "essentials": [],
    "toiletries": [],
    "electronics": [],
    "documents": ["Aadhar/ID", "Train/flight tickets", "Hotel bookings"],
    "tripSpecific": []
  },
  "scenicSpots": [
    { "name": "most famous/Instagram-worthy spot", "description": "short description", "bestTime": "best time to visit", "whyPicturePerfect": "why it is picture-perfect" }
  ],
  "budgetBreakdown": {
    "accommodation": 0,
    "food": 0,
    "transport": 0,
    "activities": 0,
    "miscellaneous": 0,
    "total": 0,
    "perPerson": 0,
    "currency": "INR",
    "notes": "budget breakdown note"
  },
  "safetyInfo": {
    "emergencyNumbers": {
      "police": "${emergency_police || '100'}",
      "ambulance": "${emergency_ambulance || '108'}",
      "tourist_helpline": "${emergency_tourist || '1800-11-1363'}"
    },
    "generalTips": [],
    "soloTips": [],
    "healthTips": [],
    "safeAreas": [],
    "areasToAvoid": []
  },
  "hiddenGems": [
    { "name": "...", "description": "...", "howToReach": "...", "bestFor": "..." }
  ],
  "localPhrases": [
    { "phrase": "Hello", "local": "...", "pronunciation": "..." }
  ],
  "transportSummary": {
    "recommended": "which mode is best for this trip type and budget",
    "routeSteps": ["e.g. Flight from Delhi to Kullu", "e.g. Taxi from Kullu to Jibhi"],
    "tips": ["tip1", "tip2"],
    "localTransport": "how to get around locally at the destination"
  }
}

Generate ${days} days of itinerary. Make it detailed, engaging, and genuinely helpful for a ${userPrefs.travelersType} on a ${tripTypeStr} trip. Provide step-by-step routeSteps in transportSummary from ${userPrefs.origin || 'their location'} to ${name}. For the scenic spots, prioritize iconic landmarks, viewpoints, natural landscapes, hidden gems, and locations that offer the best photography opportunities. Always generate at least 3 authentic hidden gems for the destination, even if not explicitly provided in the source data.

IMPORTANT FOR LOCAL PHRASES: 
If ## LOCAL PHRASES is provided and not empty, you MUST use exactly those phrases. 
If ## LOCAL PHRASES is empty, you MUST identify the specific regional language spoken at the destination (e.g., Malayalam for Kerala, Kannada for Karnataka, Tamil for Tamil Nadu, Marathi for Maharashtra) and generate phrases in THAT specific local language. DO NOT default to Hindi unless Hindi is the primary local language of that specific state.`;
}

async function checkTripFeasibility({ destination, routes, userPrefs }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured in .env');

  const days = calculateDays(userPrefs.startDate, userPrefs.endDate);
  
  const transportCostMin = routes.modes?.reduce((min, mode) => {
    return Math.min(min, mode.estimatedCostINR?.min || Infinity);
  }, Infinity) || 0;
  const transportCostEstimate = (transportCostMin === Infinity ? 0 : transportCostMin) * userPrefs.travelersCount * 2; // round trip

  const prompt = `You are an expert travel financial planner.
  
Calculate the complete estimated trip cost for the following trip.
Destination: ${destination.name} (${destination.state || ''} ${destination.country || ''})
Duration: ${days} days
Travelers: ${userPrefs.travelersCount} (${userPrefs.travelersType})
Trip Type: ${userPrefs.tripType}
User's Total Budget: ₹${userPrefs.budgetMax}

Intercity Transport (Round Trip) Estimated Minimum: ₹${transportCostEstimate} (This MUST be included in the total cost).

Calculate estimated costs for:
1. Round-trip intercity transport (use the provided estimate or higher)
2. Accommodation for ${days - 1} nights
3. Food for ${days} days
4. Local transport and activities
5. A 10-15% emergency buffer

Compare the estimated total cost with the User's Total Budget (₹${userPrefs.budgetMax}).
If the estimated total cost exceeds the user's budget, the trip is unaffordable.

Return ONLY a raw JSON object with this exact schema (no markdown, no backticks):
{
  "isAffordable": boolean,
  "estimatedTotal": number,
  "shortfall": number (0 if affordable),
  "suggestions": ["suggestion 1", "suggestion 2"] (if unaffordable, suggest how to reduce costs: cheaper transport, fewer days, etc. Max 3 suggestions. If affordable, leave empty)
}`;

  try {
    const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        }
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error('Failed to check feasibility with Gemini');
    
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    
    return JSON.parse(text);
  } catch (err) {
    console.error('Feasibility check failed:', err.message);
    // Fallback if AI fails: just assume it's affordable so we don't break the flow completely
    return { isAffordable: true, estimatedTotal: userPrefs.budgetMax, shortfall: 0, suggestions: [] };
  }
}

function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 3;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(diff, 14));
}

module.exports = { generateTripPlan, checkTripFeasibility };
