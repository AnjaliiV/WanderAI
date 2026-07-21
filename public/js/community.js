/**
 * community.js — Community page logic
 */

document.addEventListener('DOMContentLoaded', () => {
  loadReviews();
  initReviewForm();
  initStarRating();
  initTagToggles();
});

// ── Load Reviews ──────────────────────────────────────────────
async function loadReviews() {
  const feed = document.getElementById('reviews-feed');
  if (!feed) return;

  // Hardcoded as requested
  feed.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text-muted);">No review yet</div>`;
}

function renderReviewCard(r) {
  const tags = JSON.parse(r.tags || '[]');
  const initial = r.author_name?.[0]?.toUpperCase() || '?';
  const destName = r.destination_name || 'Unknown Destination';

  return `
    <div class="community-review-card reveal">
      <div class="review-card-header">
        <div class="review-user">
          <div class="review-avatar-lg">${initial}</div>
          <div>
            <div class="review-user-name">${r.author_name}</div>
            <div class="review-user-dest">📍 ${destName}</div>
          </div>
        </div>
        <div class="review-rating-date">
          <div class="review-rating">${starsHtml(r.rating)}</div>
          <div class="review-date">${new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
        </div>
      </div>
      <div class="review-card-body">
        ${r.title ? `<div class="review-card-title">${r.title}</div>` : ''}
        <div class="review-card-body-text">"${r.body}"</div>
        ${tags.length ? `<div class="review-card-tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
        ${r.accommodation_name ? `
          <div class="review-accommodation">
            <div style="display:flex;align-items:center;gap:0.75rem;">
              <span class="accom-icon">🏨</span>
              <div>
                <div class="accom-name">${r.accommodation_name}</div>
                <div class="accom-type">${r.accommodation_type || 'Accommodation'}</div>
              </div>
            </div>
            ${r.accommodation_rating ? `<div class="accom-rating-val">⭐ ${r.accommodation_rating}/5</div>` : ''}
          </div>
        ` : ''}
      </div>
      <div class="review-card-footer">
        <button class="helpful-btn" data-id="${r.id}">
          👍 Helpful <span class="helpful-count">${r.helpful || 0}</span>
        </button>
        <span style="font-size:0.75rem;color:var(--text-dim);">Verified traveler</span>
      </div>
    </div>
  `;
}

// ── Review Form ───────────────────────────────────────────────
let selectedRating = 0;
let selectedTags = [];

function initStarRating() {
  const stars = document.querySelectorAll('.star-btn');
  stars.forEach((star, i) => {
    star.addEventListener('mouseover', () => highlightStars(i + 1));
    star.addEventListener('mouseleave', () => highlightStars(selectedRating));
    star.addEventListener('click', () => {
      selectedRating = i + 1;
      highlightStars(selectedRating);
    });
  });
}

function highlightStars(count) {
  document.querySelectorAll('.star-btn').forEach((star, i) => {
    star.classList.toggle('active', i < count);
  });
}

function initTagToggles() {
  document.querySelectorAll('.tag-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      btn.classList.toggle('selected');
      if (btn.classList.contains('selected')) {
        selectedTags.push(tag);
      } else {
        selectedTags = selectedTags.filter(t => t !== tag);
      }
    });
  });
}

function initReviewForm() {
  const form = document.getElementById('review-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedRating) { showToast('Please select a star rating', 'error'); return; }

    const destSearch = document.getElementById('review-dest-search')?.value?.trim();
    if (!destSearch) { showToast('Please enter the destination you visited', 'error'); return; }

    const payload = {
      destinationId: null, // without auth, we'll resolve on backend or use text
      authorName: document.getElementById('review-author')?.value?.trim(),
      rating: selectedRating,
      title: document.getElementById('review-title')?.value?.trim(),
      body: document.getElementById('review-body')?.value?.trim(),
      tags: selectedTags,
      accommodationName: document.getElementById('accom-name')?.value?.trim() || undefined,
      accommodationType: document.getElementById('accom-type')?.value || undefined,
      accommodationRating: parseInt(document.getElementById('accom-rating')?.value || 0) || undefined,
    };

    if (!payload.authorName) { showToast('Please enter your name', 'error'); return; }
    if (!payload.body || payload.body.length < 10) { showToast('Please write a review (min 10 chars)', 'error'); return; }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
      // Find destination by name
      const searchRes = await api.search(destSearch);
      const destResult = searchRes.results?.[0];

      if (destResult?.slug) {
        const destData = await api.getDestination(destResult.slug);
        payload.destinationId = destData.destination?.id;
      }

      await api.submitReview(payload);
      showToast('✅ Review submitted! Thank you for sharing.', 'success');
      form.reset();
      selectedRating = 0;
      selectedTags = [];
      highlightStars(0);
      document.querySelectorAll('.tag-toggle').forEach(b => b.classList.remove('selected'));
      setTimeout(loadReviews, 1000);
    } catch (err) {
      showToast(err.message || 'Could not submit review. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit Review';
    }
  });
}
