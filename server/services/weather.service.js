'use strict';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

const WMO_CODES = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  95: 'Thunderstorm', 99: 'Thunderstorm with hail',
};

/**
 * Fetches real weather data from Open-Meteo (no API key required).
 * Returns current conditions + 7-day forecast.
 */
async function getWeather(lat, lng, startDate = null, endDate = null) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const forecastEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const params = new URLSearchParams({
      latitude: lat,
      longitude: lng,
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max',
      timezone: 'Asia/Kolkata',
      start_date: today,
      end_date: forecastEnd,
      wind_speed_unit: 'kmh',
    });

    const res = await fetch(`${OPEN_METEO_BASE}?${params}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
    const data = await res.json();

    return parseWeatherData(data, startDate);
  } catch (err) {
    console.error('[WeatherService]', err.message);
    return getSeasonalFallback(lat);
  }
}

function parseWeatherData(data, tripStartDate) {
  const c = data.current || {};
  const d = data.daily || {};

  const current = {
    tempC: Math.round(c.temperature_2m || 0),
    humidity: c.relative_humidity_2m || null,
    windKmh: Math.round(c.wind_speed_10m || 0),
    condition: WMO_CODES[c.weather_code] || 'Unknown',
    weatherCode: c.weather_code,
  };

  const forecast = (d.time || []).map((date, i) => ({
    date,
    maxTempC: Math.round(d.temperature_2m_max?.[i] ?? 0),
    minTempC: Math.round(d.temperature_2m_min?.[i] ?? 0),
    precipitationMm: Math.round((d.precipitation_sum?.[i] ?? 0) * 10) / 10,
    condition: WMO_CODES[d.weather_code?.[i]] || 'Unknown',
    windKmh: Math.round(d.wind_speed_10m_max?.[i] ?? 0),
  }));

  // Derive packing advice
  const avgMax = forecast.length > 0
    ? forecast.reduce((s, f) => s + f.maxTempC, 0) / forecast.length
    : current.tempC;

  const packingAdvice = derivePackingAdvice(avgMax, current.condition, current.windKmh);
  const season = getSeason(new Date().getMonth());

  return { current, forecast, packingAdvice, season, avgTempC: Math.round(avgMax) };
}

function derivePackingAdvice(avgTemp, condition, wind) {
  const advice = [];
  if (avgTemp < 5) advice.push('Heavy winter jacket', 'Thermal inners', 'Gloves & woollen cap', 'Snow boots');
  else if (avgTemp < 15) advice.push('Fleece / light jacket', 'Layering clothes', 'Warm socks');
  else if (avgTemp < 25) advice.push('Light jacket for evenings', 'Comfortable layers');
  else advice.push('Light cotton clothes', 'Sunscreen SPF50+', 'Hat / cap', 'Sunglasses');

  if (condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('shower')) {
    advice.push('Raincoat / poncho', 'Waterproof bag cover', 'Quick-dry clothes');
  }
  if (wind > 30) advice.push('Windproof jacket');

  return advice;
}

function getSeason(month) {
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Monsoon / Summer';
  if (month >= 8 && month <= 10) return 'Autumn / Post-monsoon';
  return 'Winter';
}

function getSeasonalFallback(lat) {
  const month = new Date().getMonth();
  const isHill = lat > 28;
  const tempC = isHill ? [5, 8, 12, 18, 22, 20, 16, 14, 16, 18, 10, 6][month] : [25, 27, 30, 34, 36, 32, 29, 29, 30, 30, 27, 25][month];
  return {
    current: { tempC, condition: 'Seasonal estimate', humidity: null, windKmh: null },
    forecast: [],
    packingAdvice: ['Comfortable clothes', 'Sunscreen', 'Water bottle'],
    season: getSeason(month),
    avgTempC: tempC,
    fallback: true,
  };
}

module.exports = { getWeather };
