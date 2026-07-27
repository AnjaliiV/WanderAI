/**
 * map.js — Leaflet.js map integration for the trip planner
 * Renders destination, attractions, hotels, restaurants, scenic spots.
 */

let planMap = null;
let markersLayer = null;

const MARKER_COLORS = {
  attraction: '#6C63FF',
  hotel:      '#06D6A0',
  restaurant: '#FF6B6B',
  scenic:     '#FFD166',
  center:     '#FF6B6B',
};

const MARKER_ICONS = {
  attraction: '🏛️',
  hotel:      '🏨',
  restaurant: '🍽️',
  scenic:     '📸',
  center:     '📍',
};

function initPlanMap(lat, lng) {
  if (planMap) {
    planMap.remove();
    planMap = null;
  }

  planMap = L.map('plan-map', {
    center: [lat, lng],
    zoom: 12,
    zoomControl: true,
    attributionControl: true,
  });

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(planMap);

  markersLayer = L.layerGroup().addTo(planMap);

  return planMap;
}

function createMarkerIcon(type, label) {
  const color = MARKER_COLORS[type] || MARKER_COLORS.attraction;
  const icon = MARKER_ICONS[type] || '📍';

  return L.divIcon({
    html: `
      <div style="
        width: 32px; height: 32px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        border: 2px solid rgba(255,255,255,0.3);
        position: relative;
      ">
        <span style="transform: rotate(45deg); font-size: 13px; position: absolute;">${icon}</span>
      </div>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function addMarkers(mapData) {
  if (!planMap || !mapData || !markersLayer) return;
  markersLayer.clearLayers();

  const bounds = [];

  // Only Center marker
  const center = mapData.center;
  if (center?.lat && center?.lng) {
    const m = L.marker([center.lat, center.lng], { icon: createMarkerIcon('center', 'Center') })
      .bindPopup(`<b>📍 ${center.name || 'Destination'}</b>`)
      .addTo(markersLayer);
    bounds.push([center.lat, center.lng]);
  }

  // Fit bounds
  if (bounds.length > 1) {
    try { planMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 }); }
    catch (e) { planMap.setView([center.lat, center.lng], 12); }
  } else if (center?.lat) {
    planMap.setView([center.lat, center.lng], 12);
  }
}

window.initPlanMap = initPlanMap;
window.addMarkers = addMarkers;
