/**
 * api.js — Frontend API client
 * ALL external API calls go through our backend /api/* endpoints.
 * NO API keys are stored or used here.
 */

const BASE = '';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  // Attach Firebase Mock token if available
  const sessionStr = localStorage.getItem('fb_mock_session');
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      if (session.token) {
        opts.headers['Authorization'] = `Bearer ${session.token}`;
      }
    } catch(e) {}
  }

  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error || data?.errors?.[0]?.msg || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

const api = {
  // Trip Planning
  planTrip: (payload) => request('POST', '/api/plan', payload),

  // Search / Autocomplete
  search: (q) => request('GET', `/api/search?q=${encodeURIComponent(q)}`),

  // Destinations
  getFeatured: () => request('GET', '/api/destinations/featured'),
  getAllDestinations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/api/destinations${qs ? '?' + qs : ''}`);
  },
  getDestination: (slug) => request('GET', `/api/destinations/${slug}`),

  // Reviews
  getRecentReviews: () => request('GET', '/api/reviews'),
  getDestinationReviews: (slug) => request('GET', `/api/reviews/destination/${slug}`),
  submitReview: (payload) => request('POST', '/api/reviews', payload),
  markHelpful: (id) => request('POST', `/api/reviews/${id}/helpful`),
};

window.api = api;
