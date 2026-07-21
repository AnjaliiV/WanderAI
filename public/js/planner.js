/**
 * planner.js — Trip Planner Page Logic
 * Handles: form wizard, destination autocomplete, API call, result rendering.
 */

// ── State ─────────────────────────────────────────────────────
let selectedTravelers = 'solo';
let selectedTripType = ['adventure'];
let budgetValue = 25000;
let currentPlan = null;
let searchDebounceTimer = null;

// ── DOM Ready ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTravelerSelector();
  initTripTypeSelector();
  initBudgetSlider();
  initDestSearch();
  initFormSubmit();
  initPlanTabs();
  showStep('form');
});

// ── Step Management ───────────────────────────────────────────
function showStep(step) {
  document.getElementById('step-form')?.classList.toggle('hidden', step !== 'form');
  document.getElementById('step-loading')?.classList.toggle('hidden', step !== 'loading');
  document.getElementById('step-results')?.classList.toggle('hidden', step !== 'results');

  // Update indicator
  document.querySelectorAll('.step-ind').forEach(el => {
    const s = el.dataset.step;
    el.classList.remove('active', 'done');
    if (s === step) el.classList.add('active');
    else if ((step === 'loading' && s === 'form') || (step === 'results' && (s === 'form' || s === 'loading'))) {
      el.classList.add('done');
      el.querySelector('.step-ind-num').textContent = '✓';
    }
  });
}

// ── Traveler Selector ─────────────────────────────────────────
function initTravelerSelector() {
  document.querySelectorAll('.traveler-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.traveler-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTravelers = btn.dataset.value;
      
      const countInput = document.getElementById('travelers-count');
      if (countInput) {
        if (selectedTravelers === 'couple') {
          countInput.value = 2;
        } else if (selectedTravelers === 'family' || selectedTravelers === 'group') {
          if (parseInt(countInput.value, 10) < 2) {
            countInput.value = 2;
          }
        } else if (selectedTravelers === 'solo') {
          countInput.value = 1;
        }
      }
    });
  });
}

// ── Trip Type Selector ────────────────────────────────────────
function initTripTypeSelector() {
  document.querySelectorAll('.trip-type-option').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      const val = btn.dataset.value;
      if (selectedTripType.includes(val)) {
        selectedTripType = selectedTripType.filter(t => t !== val);
      } else {
        selectedTripType.push(val);
      }
      
      // Ensure at least one is selected
      if (selectedTripType.length === 0) {
        btn.classList.add('selected');
        selectedTripType.push(val);
        showToast('Please select at least one trip type', 'error');
      }
    });
  });
}

// ── Budget Slider ─────────────────────────────────────────────
function initBudgetSlider() {
  const slider = document.getElementById('budget-slider');
  const inputBox = document.getElementById('budget-input-box');
  
  if (slider && inputBox) {
    slider.addEventListener('input', () => {
      budgetValue = parseInt(slider.value);
      inputBox.value = budgetValue;
    });

    inputBox.addEventListener('input', () => {
      let val = parseInt(inputBox.value) || 2000;
      if (val < 2000) val = 2000;
      if (val > 200000) val = 200000;
      budgetValue = val;
      slider.value = budgetValue;
    });
  }
}

// ── Destination Search with Debounced Autocomplete ────────────
function initDestSearch() {
  const input = document.getElementById('dest-input');
  const dropdown = document.getElementById('dest-dropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    const q = input.value.trim();
    if (q.length < 2) { dropdown.classList.remove('open'); return; }

    searchDebounceTimer = setTimeout(async () => {
      try {
        const data = await api.search(q);
        renderDestDropdown(data.results || [], dropdown, input);
      } catch (e) { console.warn('Search error:', e.message); }
    }, 300);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) dropdown.classList.add('open');
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

function renderDestDropdown(results, dropdown, input) {
  if (results.length === 0) { dropdown.classList.remove('open'); return; }

  const typeIcons = { mountain: '🏔️', beach: '🏖️', city: '🏙️', heritage: '🕌', village: '🏡', valley: '🌿', spiritual: '🕍', island: '🌊' };

  dropdown.innerHTML = results.map(r => `
    <div class="dest-dropdown-item" data-name="${r.name}" data-state="${r.state || ''}" data-country="${r.country || ''}">
      <span class="dest-type-icon">${typeIcons[r.type] || '📍'}</span>
      <div>
        <div class="dest-name-main">${r.name}</div>
        <div class="dest-name-sub">${[r.state, r.country].filter(Boolean).join(', ')} ${r.source === 'database' ? '<span style="color:var(--success);font-size:0.7rem;">✓ Curated</span>' : ''}</div>
      </div>
    </div>
  `).join('');

  dropdown.classList.add('open');

  dropdown.querySelectorAll('.dest-dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      input.value = item.dataset.name;
      dropdown.classList.remove('open');
    });
  });
}

// ── Form Submit ───────────────────────────────────────────────
function initFormSubmit() {
  const form = document.getElementById('planner-form');
  if (!form) return;
  form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
  if (e) e.preventDefault();

  const destination = document.getElementById('dest-input')?.value?.trim();
  const startDate   = document.getElementById('start-date')?.value;
  const endDate     = document.getElementById('end-date')?.value;
  const origin      = document.getElementById('origin-input')?.value?.trim() || '';
  const travelersCount = parseInt(document.getElementById('travelers-count')?.value || '1');

  if (!destination) { showToast('Please enter a destination', 'error'); return; }
  if (!origin) { showToast('Please enter your starting city', 'error'); return; }
  if (!startDate || !endDate) { showToast('Please select travel dates', 'error'); return; }
  if (new Date(endDate) <= new Date(startDate)) { showToast('End date must be after start date', 'error'); return; }

  showStep('loading');
  animateLoadingSteps();

  try {
    const result = await api.planTrip({
      destination,
      origin,
      startDate,
      endDate,
      travelersCount,
      travelersType: selectedTravelers,
      tripType: selectedTripType,
      budgetMin: Math.round(budgetValue * 0.5),
      budgetMax: budgetValue,
    });

    if (result.unaffordable) {
      showStep('form');
      showFeasibilityModal(result.feasibility);
      return;
    }

    currentPlan = result;
    renderPlan(result);
    showStep('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`🗺️ Plan ready for ${result.destination.name}!`, 'success');
  } catch (err) {
    console.error('Planning error:', err);
    showStep('form');
    showToast(err.message || 'Failed to generate plan. Please try again.', 'error');
  }
}

function animateLoadingSteps() {
  const steps = document.querySelectorAll('.loading-step');
  let i = 0;
  const interval = setInterval(() => {
    if (i > 0) {
      steps[i-1]?.classList.remove('active');
      steps[i-1]?.classList.add('done');
    }
    if (i < steps.length) {
      steps[i]?.classList.add('active');
      i++;
    } else {
      clearInterval(interval);
    }
  }, 2800);
}

// ── Plan Rendering ────────────────────────────────────────────
function renderPlan(result) {
  const plan = result.plan;
  const dest = result.destination;

  renderDestHeader(dest, plan);
  renderOverview(plan.overview);
  renderWeather(plan.weatherData);
  renderTransport(plan.transportData, plan.transportSummary);
  renderItinerary(plan.itinerary);
  renderMap(plan.mapData, dest);
  renderAccommodation(plan.accommodation);
  renderFood(plan.foodGuide);
  renderPacking(plan.packingList);
  renderScenic(plan.scenicSpots);
  renderBudget(plan.budgetBreakdown);
  renderSafety(plan.safetyInfo);
  renderHiddenGems(plan.hiddenGems);
  renderLocalPhrases(plan.localPhrases);
  setupSaveTripButton(result.tripId, dest.name);
}

function renderDestHeader(dest, plan) {
  const el = document.getElementById('plan-dest-header');
  if (!el) return;

  const tags = plan.overview?.quickFacts ? [
    dest.type, plan.tripType
  ].filter(Boolean) : [dest.type];

  el.innerHTML = `
    <div>
      <div class="plan-dest-title">${getDestEmoji(dest.type)} ${dest.name}</div>
      <div class="plan-dest-location">📍 ${[dest.state, dest.country].filter(Boolean).join(', ')}</div>
      <div class="plan-dest-tags">
        ${tags.map(t => `<span class="badge badge-primary">${t}</span>`).join('')}
        ${dest.source === 'database' ? '<span class="badge badge-success">✓ Curated</span>' : '<span class="badge badge-accent">📡 Discovered</span>'}
      </div>
    </div>
    <div class="plan-meta-grid">
      <div class="plan-meta-item">
        <div class="plan-meta-label">Best Time</div>
        <div class="plan-meta-value">${plan.overview?.bestTimeToVisit?.split('.')[0] || 'Year-round'}</div>
      </div>
      <div class="plan-meta-item">
        <div class="plan-meta-label">Currency</div>
        <div class="plan-meta-value">${plan.overview?.quickFacts?.currency || 'INR ₹'}</div>
      </div>
      <div class="plan-meta-item">
        <div class="plan-meta-label">Language</div>
        <div class="plan-meta-value">${plan.overview?.quickFacts?.language || 'Hindi'}</div>
      </div>
      <div class="plan-meta-item">
        <div class="plan-meta-label">Known For</div>
        <div class="plan-meta-value">${plan.overview?.quickFacts?.knownFor || dest.type}</div>
      </div>
    </div>
  `;
}

function renderOverview(overview) {
  const el = document.getElementById('overview-content');
  if (!el || !overview) return;

  el.innerHTML = `
    <p class="overview-desc">${overview.description || ''}</p>
    ${overview.highlights?.length ? `
      <div class="overview-highlights">
        ${overview.highlights.map(h => `
          <div class="overview-highlight">
            <span class="highlight-check">✓</span> ${h}
          </div>
        `).join('')}
      </div>
    ` : ''}
    ${overview.localTips?.length ? `
      <div class="overview-tips">
        <h4 style="margin-bottom:0.75rem;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);">💡 Local Tips</h4>
        ${overview.localTips.map(tip => `
          <div class="overview-tip">
            <span class="tip-icon">💡</span>
            <span>${tip}</span>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

function renderWeather(weather) {
  const el = document.getElementById('weather-content');
  if (!el || !weather) return;

  const wIcons = (code) => {
    if (!code && code !== 0) return '🌤️';
    if (code === 0 || code === 1) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌦️';
    return '⛈️';
  };

  el.innerHTML = `
    <div class="weather-current">
      <div>
        <div class="weather-temp">${weather.current?.tempC ?? '--'}°C</div>
        <div class="weather-cond">${weather.current?.condition || 'Current conditions'}</div>
        <div class="weather-season">Season: ${weather.season || ''}</div>
      </div>
      <div class="weather-details">
        ${weather.current?.humidity ? `<div class="weather-detail">💧 Humidity: ${weather.current.humidity}%</div>` : ''}
        ${weather.current?.windKmh ? `<div class="weather-detail">💨 Wind: ${weather.current.windKmh} km/h</div>` : ''}
      </div>
    </div>
    ${weather.forecast?.length ? `
      <div class="weather-forecast">
        ${weather.forecast.slice(0, 7).map(f => `
          <div class="forecast-day">
            <div class="forecast-date">${new Date(f.date).toLocaleDateString('en-IN',{weekday:'short'})}</div>
            <div class="forecast-icon">${wIcons(f.weatherCode)}</div>
            <div class="forecast-high">${f.maxTempC}°</div>
            <div class="forecast-low">${f.minTempC}°</div>
          </div>
        `).join('')}
      </div>
    ` : ''}
    ${weather.packingAdvice?.length ? `
      <div style="margin-top:1.5rem;">
        <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.75rem;">🎒 Weather-Based Packing</h4>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
          ${weather.packingAdvice.map(a => `<span class="badge badge-primary">${a}</span>`).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

function renderTransport(routes, summary) {
  const el = document.getElementById('transport-content');
  if (!el) return;

  const modes = routes?.modes || [];
  if (modes.length === 0) {
    el.innerHTML = `<p class="text-muted" style="text-align:center;">Enter an origin city in the form to see transport options.</p>`;
    return;
  }
  
  const recText = (summary?.recommended || '').toLowerCase();
  modes.forEach(m => {
    m.isRec = recText.includes(m.mode.toLowerCase()) || (m.mode === 'road' && recText.includes('car'));
  });
  
  // Fallback to first if none matched
  if (modes.length > 0 && !modes.some(m => m.isRec)) {
    modes[0].isRec = true;
  }

  el.innerHTML = `
    ${summary?.recommended ? `
      <div style="padding:1rem;background:rgba(6,214,160,0.07);border:1px solid rgba(6,214,160,0.2);border-radius:var(--radius-md);margin-bottom:1.5rem;font-size:0.88rem;">
        <b>✅ Recommended:</b> ${summary.recommended}
      </div>
    ` : ''}
    <div class="transport-grid">
      ${modes.map(m => `
        <div class="transport-card ${m.isRec ? 'recommended' : ''}">
          <div class="transport-header">
            <span class="transport-icon">${m.icon}</span>
            <div>
              <div class="transport-mode">${m.label}</div>
              ${m.isRec ? '<span class="badge badge-success" style="font-size:0.65rem;">Recommended</span>' : ''}
            </div>
          </div>
          <div class="transport-stats">
            <div>
              <div class="transport-stat-label">Duration</div>
              <div class="transport-stat-val">${m.durationText || 'Varies'}</div>
            </div>
            <div>
              <div class="transport-stat-label">Est. Cost</div>
              <div class="transport-stat-val">${m.estimatedCostINR ? formatINR(m.estimatedCostINR.min) + ' – ' + formatINR(m.estimatedCostINR.max) : 'Check online'}</div>
            </div>
            ${m.distanceKm ? `
              <div>
                <div class="transport-stat-label">Distance</div>
                <div class="transport-stat-val">${m.distanceKm} km</div>
              </div>
            ` : ''}
          </div>
          <div class="transport-note">${m.notes || ''}</div>
        </div>
      `).join('')}
    </div>
    ${summary?.routeSteps?.length ? `
      <div style="margin-top:1.5rem;padding:1.5rem;background:var(--dark);border-radius:var(--radius-md);border-left:4px solid var(--primary);">
        <h4 style="margin-bottom:1rem;color:var(--primary);">🗺️ Step-by-Step Route Plan</h4>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.75rem;">
          ${summary.routeSteps.map((step, idx) => `
            <li style="display:flex;gap:1rem;align-items:start;">
              <span style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:var(--primary);color:white;border-radius:50%;font-size:0.75rem;flex-shrink:0;">${idx+1}</span>
              <span style="color:var(--text);font-size:0.95rem;line-height:1.4;">${step}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    ${summary?.localTransport ? `
      <div style="margin-top:1.5rem;padding:1rem;background:var(--dark);border-radius:var(--radius-md);">
        <b>🛺 Local Transport:</b> <span style="color:var(--text-muted);font-size:0.88rem;">${summary.localTransport}</span>
      </div>
    ` : ''}
  `;
}

function renderItinerary(itinerary) {
  const el = document.getElementById('itinerary-content');
  if (!el || !itinerary?.length) return;

  el.innerHTML = itinerary.map(day => `
    <div class="itinerary-day">
      <div class="day-header">
        <div class="day-num">${day.day}</div>
        <div class="day-theme">${day.theme || `Day ${day.day}`}</div>
      </div>
      <div class="day-slots">
        ${renderSlot(day.morning, '☀️')}
        ${renderSlot(day.afternoon, '🌤️')}
        ${renderSlot(day.evening, '🌙')}
      </div>
    </div>
  `).join('');
}

function renderSlot(slot, icon) {
  if (!slot) return '';
  return `
    <div class="day-slot">
      <div class="slot-time">${icon} ${slot.time || ''}</div>
      <div class="slot-activity">${slot.activity || ''}</div>
      ${slot.place ? `<div class="slot-place">📍 ${slot.place}</div>` : ''}
      ${slot.description ? `<div class="slot-desc">${slot.description}</div>` : ''}
      ${slot.tip ? `<div class="slot-tip"><span>💡</span>${slot.tip}</div>` : ''}
    </div>
  `;
}

function renderMap(mapData, dest) {
  if (!mapData) return;

  setTimeout(() => {
    try {
      const lat = mapData.center?.lat || dest.lat;
      const lng = mapData.center?.lng || dest.lng;
      initPlanMap(lat, lng);
      addMarkers(mapData);
    } catch (e) {
      console.warn('Map init failed:', e.message);
    }
  }, 100);
}

function renderAccommodation(accommodation) {
  const el = document.getElementById('accommodation-content');
  if (!el || !accommodation) return;

  const tierColors = { budget: 'success', mid: 'accent', luxury: 'primary' };
  const tierIcons  = { budget: '💰', mid: '⭐', luxury: '👑' };

  el.innerHTML = `
    <div class="accommodation-grid">
      ${(accommodation.recommendations || []).map(h => `
        <div class="hotel-card">
          <div class="hotel-type-badge">
            <span class="badge badge-${tierColors[h.type] || 'primary'}">${tierIcons[h.type] || '🏨'} ${h.type || 'Stay'}</span>
          </div>
          <div class="hotel-name">${h.name}</div>
          <div class="hotel-price">${h.pricePerNight || 'Price on request'}/night</div>
          <div class="hotel-desc">${h.description || ''}</div>
          ${h.features?.length ? `<div class="hotel-features">${h.features.map(f => `<span class="hotel-feature">${f}</span>`).join('')}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ${accommodation.bookingTips?.length ? `
      <div style="margin-top:1.5rem;">
        <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.75rem;">📋 Booking Tips</h4>
        ${accommodation.bookingTips.map(t => `<div class="overview-tip"><span class="tip-icon">💡</span>${t}</div>`).join('')}
      </div>
    ` : ''}
  `;
}

function renderFood(foodGuide) {
  const el = document.getElementById('food-content');
  if (!el || !foodGuide) return;

  el.innerHTML = `
    ${foodGuide.famousDishes?.length ? `
      <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:1rem;">🍽️ Famous Dishes</h4>
      <div class="food-dishes-grid">
        ${foodGuide.famousDishes.map(d => `
          <div class="dish-card">
            <div class="dish-icon">🍛</div>
            <div>
              <div class="dish-name">${d.name}${d.mustTry ? ' <span style="color:var(--secondary);font-size:0.72rem;">Must Try</span>' : ''}</div>
              <div class="dish-desc">${d.description || ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${foodGuide.restaurants?.length ? `
      <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin:1.5rem 0 1rem;">🏪 Where to Eat</h4>
      <div class="restaurants-list">
        ${foodGuide.restaurants.map(r => `
          <div class="restaurant-item">
            <div>
              <div class="restaurant-name">${r.name}</div>
              <div class="restaurant-meta">${r.cuisine || ''} ${r.specialty ? '· ' + r.specialty : ''}</div>
            </div>
            <div class="restaurant-price">${r.priceRange || ''}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${foodGuide.foodTips?.length ? `
      <div style="margin-top:1.5rem;">
        ${foodGuide.foodTips.map(t => `<div class="overview-tip"><span class="tip-icon">🍴</span>${t}</div>`).join('')}
      </div>
    ` : ''}
  `;
}

function renderPacking(packingList) {
  const el = document.getElementById('packing-content');
  if (!el || !packingList) return;

  const cats = [
    { key: 'clothing',    icon: '👕', label: 'Clothing' },
    { key: 'essentials',  icon: '🎒', label: 'Essentials' },
    { key: 'toiletries',  icon: '🧴', label: 'Toiletries' },
    { key: 'electronics', icon: '🔌', label: 'Electronics' },
    { key: 'documents',   icon: '📄', label: 'Documents' },
    { key: 'tripSpecific',icon: '🗺️', label: 'Trip-Specific' },
  ];

  el.innerHTML = `<div class="packing-categories">${
    cats.map(c => {
      const items = packingList[c.key] || [];
      if (!items.length) return '';
      return `
        <div>
          <div class="packing-category-title">${c.icon} ${c.label}</div>
          <div class="packing-items">
            ${items.map((item, i) => `
              <label class="packing-item" id="pack-${c.key}-${i}">
                <input type="checkbox" onchange="togglePack(this)">
                <span>${item}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }).join('')
  }</div>`;
}

function togglePack(checkbox) {
  const label = checkbox.closest('.packing-item');
  label?.classList.toggle('checked', checkbox.checked);
}
window.togglePack = togglePack;

function renderScenic(scenicSpots) {
  const el = document.getElementById('scenic-content');
  if (!el || !scenicSpots?.length) return;

  el.innerHTML = `<div class="scenic-spots-grid">${scenicSpots.map(s => `
    <div class="scenic-card" style="padding:1.2rem; display:flex; flex-direction:column; gap:0.5rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px;">
      <div class="scenic-name" style="margin:0; font-size:1.1rem; font-weight:600; color:var(--text);">${s.name}</div>
      ${s.description ? `<div style="font-size:0.9rem; color:var(--text-muted);">${s.description}</div>` : ''}
      <div style="display:flex; flex-direction:column; gap:0.3rem; margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid rgba(255,255,255,0.05);">
        ${s.bestTime ? `<div style="font-size:0.85rem; color:var(--primary-light);">🌅 <strong>Best Time:</strong> ${s.bestTime}</div>` : ''}
        ${s.whyPicturePerfect ? `<div style="font-size:0.85rem; color:var(--accent);">📸 <strong>Why it's picture-perfect:</strong> ${s.whyPicturePerfect}</div>` : ''}
      </div>
    </div>
  `).join('')}</div>`;
}

function renderBudget(budgetBreakdown) {
  if (!budgetBreakdown) return;
  renderBudgetChart(budgetBreakdown);
}

function renderSafety(safetyInfo) {
  const el = document.getElementById('safety-content');
  if (!el || !safetyInfo) return;

  const e = safetyInfo.emergencyNumbers || {};
  el.innerHTML = `
    <div class="emergency-banner">
      <div class="emergency-title">🚨 Emergency Numbers</div>
      <div class="emergency-numbers">
        <div class="emergency-num">
          <div class="emergency-num-label">Police</div>
          <div class="emergency-num-val">${e.police || '100'}</div>
        </div>
        <div class="emergency-num">
          <div class="emergency-num-label">Ambulance</div>
          <div class="emergency-num-val">${e.ambulance || '108'}</div>
        </div>
        <div class="emergency-num">
          <div class="emergency-num-label">Tourist Helpline</div>
          <div class="emergency-num-val">${e.tourist_helpline || '1363'}</div>
        </div>
      </div>
    </div>
    ${safetyInfo.generalTips?.length ? `
      <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:1rem;">General Safety Tips</h4>
      <div class="safety-tips-grid">
        ${safetyInfo.generalTips.map(t => `<div class="safety-tip-item"><span class="safety-tip-icon">🛡️</span>${t}</div>`).join('')}
      </div>
    ` : ''}
    ${safetyInfo.soloTips?.length ? `
      <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin:1.5rem 0 1rem;">🧑 Solo Traveler Tips</h4>
      <div class="safety-tips-grid">
        ${safetyInfo.soloTips.map(t => `<div class="safety-tip-item"><span class="safety-tip-icon">👤</span>${t}</div>`).join('')}
      </div>
    ` : ''}
    ${safetyInfo.healthTips?.length ? `
      <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin:1.5rem 0 1rem;">🏥 Health Tips</h4>
      <div class="safety-tips-grid">
        ${safetyInfo.healthTips.map(t => `<div class="safety-tip-item"><span class="safety-tip-icon">🏥</span>${t}</div>`).join('')}
      </div>
    ` : ''}
  `;
}

function renderHiddenGems(gems) {
  const el = document.getElementById('gems-content');
  if (!el || !gems?.length) return;

  el.innerHTML = `<div class="hidden-gems-list">${gems.map(g => `
    <div class="gem-card">
      <div class="gem-icon">💎</div>
      <div>
        <div class="gem-name">${g.name}</div>
        <div class="gem-desc">${g.description || ''}</div>
        ${g.howToReach ? `<div class="gem-how">🗺️ ${g.howToReach}</div>` : ''}
      </div>
    </div>
  `).join('')}</div>`;
}

function renderLocalPhrases(phrases) {
  const el = document.getElementById('phrases-content');
  if (!el || !phrases?.length) return;

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.75rem;">
      ${phrases.map(p => `
        <div style="padding:0.75rem 1rem;background:var(--dark);border-radius:var(--radius-md);">
          <div style="font-size:0.75rem;color:var(--text-dim);">${p.phrase}</div>
          <div style="font-weight:700;font-size:1rem;color:var(--primary-light);">${p.local}</div>
          ${p.pronunciation ? `<div style="font-size:0.75rem;color:var(--text-muted);font-style:italic;">${p.pronunciation}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function setupSaveTripButton(tripId, destName) {
  const btn = document.getElementById('save-trip-btn');
  if (!btn) return;

  // Reset button state on new plan
  btn.textContent = '💾 Save Trip';
  btn.disabled = false;
  btn.style.opacity = '1';

  // Remove existing listeners by cloning
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener('click', async () => {
    if (typeof firebaseAuth === 'undefined' || !firebaseAuth.currentUser) {
      showToast('Please log in to save trips!', 'error');
      return;
    }
    
    if (typeof firebaseFirestore === 'undefined' || !firebaseFirestore) {
      showToast('Firestore is not initialized yet.', 'error');
      return;
    }

    try {
      newBtn.textContent = 'Saving...';
      newBtn.disabled = true;

      const user = firebaseAuth.currentUser;
      await firebaseFirestore.collection('users').doc(user.uid).collection('trips').add({
        destination: destName,
        plan: currentPlan.plan,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      newBtn.textContent = '✅ Trip Saved';
      newBtn.style.opacity = '0.7';
      showToast('Trip successfully saved to your account!', 'success');
    } catch (e) {
      console.error('Error saving trip:', e);
      showToast('Failed to save trip.', 'error');
      newBtn.textContent = '💾 Save Trip';
      newBtn.disabled = false;
    }
  });
}

// ── Plan Tab Navigation ───────────────────────────────────────
function initPlanTabs() {
  const tabs = document.querySelectorAll('.plan-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const sectionId = tab.dataset.section;
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Auto-highlight tab on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        tabs.forEach(t => t.classList.toggle('active', t.dataset.section === id));
      }
    });
  }, { threshold: 0.3, rootMargin: '-100px 0px -60% 0px' });

  document.querySelectorAll('.plan-section').forEach(s => observer.observe(s));
}

// ── New Plan Button ───────────────────────────────────────────
document.getElementById('new-plan-btn')?.addEventListener('click', () => {
  showStep('form');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentPlan = null;
});

// ── Feasibility Modal ─────────────────────────────────────────
function showFeasibilityModal(feasibility) {
  let modal = document.getElementById('feasibility-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'feasibility-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">💸</div>
        <h3 style="margin-bottom: 1rem; color: var(--text-light);">Insufficient Budget</h3>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">
          Your estimated total cost is <strong>₹<span id="feas-est"></span></strong>, which exceeds your maximum budget by <strong>₹<span id="feas-short"></span></strong>. 
          This includes round-trip travel to the destination.
        </p>
        <div style="text-align: left; background: var(--bg-card); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <h4 style="margin-bottom: 0.5rem; color: var(--accent);">💡 AI Suggestions</h4>
          <ul id="feas-sugg" style="color: var(--text-muted); padding-left: 1.2rem; margin: 0; line-height: 1.5;"></ul>
        </div>
        <button class="btn btn-primary" onclick="document.getElementById('feasibility-modal').classList.remove('open')" style="width: 100%;">Got it, let me adjust</button>
      </div>
    `;
    document.body.appendChild(modal);

    // Basic CSS for modal-overlay if not exists
    if (!document.getElementById('modal-style')) {
      const style = document.createElement('style');
      style.id = 'modal-style';
      style.textContent = `
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; opacity: 0; pointer-events: none; transition: 0.3s; }
        .modal-overlay.open { opacity: 1; pointer-events: auto; }
        .modal-content { background: var(--bg-panel); padding: 2rem; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: translateY(20px); transition: 0.3s; }
        .modal-overlay.open .modal-content { transform: translateY(0); }
      `;
      document.head.appendChild(style);
    }
  }

  document.getElementById('feas-est').textContent = feasibility.estimatedTotal.toLocaleString();
  document.getElementById('feas-short').textContent = feasibility.shortfall.toLocaleString();
  
  const ul = document.getElementById('feas-sugg');
  ul.innerHTML = (feasibility.suggestions || []).map(s => `<li>${s}</li>`).join('');

  // Force a tiny delay so the transition triggers
  setTimeout(() => modal.classList.add('open'), 10);
}
