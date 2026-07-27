const { getNearbyPlaces } = require('./server/services/places.service');
const { getRoutes } = require('./server/services/routing.service');
const { getWeather } = require('./server/services/weather.service');

async function run() {
  try {
    const [places, routes, weather] = await Promise.all([
      getNearbyPlaces(31.7972, 77.2683).catch(e => { console.log('Places rejected:', e); return {}; }),
      getRoutes('new delhi', 31.7972, 77.2683).catch(e => { console.log('Routes rejected:', e); return {}; }),
      getWeather(31.7972, 77.2683).catch(e => { console.log('Weather rejected:', e); return {}; }),
    ]);
    console.log('Success', { places: !!places, routes: !!routes, weather: !!weather });
  } catch (err) {
    console.error('Promise.all threw an error:', err.message);
  }
}

run();
