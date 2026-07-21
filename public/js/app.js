/**
 * app.js — Main app utilities
 * Shared logic: toast, navbar, scroll reveal, particles, navigation.
 */

// ── Toast System ─────────────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => toast.remove(), 280);
  }, duration);
}

window.showToast = showToast;

// ── Navbar scroll effect ─────────────────────────────────────
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Mark active nav link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '/' && href === '/index.html') ||
        (href !== '/' && href !== '/index.html' && path.includes(href.replace('.html', '')))) {
      link.classList.add('active');
    }
  });
}

// ── Scroll Reveal ────────────────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── Particle System ──────────────────────────────────────────
function initParticles() {
  const container = document.querySelector('.hero-particles');
  if (!container) return;

  const count = 25;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${6 + Math.random() * 10}s;
      animation-delay: ${Math.random() * 8}s;
      --drift: ${(Math.random() - 0.5) * 80}px;
      width: ${1 + Math.random() * 3}px;
      height: ${1 + Math.random() * 3}px;
      opacity: ${0.3 + Math.random() * 0.5};
      background: ${Math.random() > 0.5 ? 'var(--primary)' : 'var(--accent)'};
    `;
    container.appendChild(p);
  }
}

// ── Mobile Nav ───────────────────────────────────────────────
function initMobileNav() {
  const toggle = document.getElementById('nav-mobile-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('mobile-open');
    toggle.textContent = links.classList.contains('mobile-open') ? '✕' : '☰';
  });
}

// ── Destination type → emoji map ─────────────────────────────
function getDestEmoji(type) {
  const map = {
    mountain: '🏔️', beach: '🏖️', city: '🏙️', heritage: '🕌', village: '🏡',
    hill_station: '⛰️', 'hill-station': '⛰️', island: '🌊', valley: '🌿',
    spiritual: '🕍', wildlife: '🦁', lake: '💧', destination: '📍', offbeat: '🗺️',
  };
  return map[type] || '📍';
}
window.getDestEmoji = getDestEmoji;

// ── Format currency ──────────────────────────────────────────
function formatINR(amount) {
  if (!amount) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}
window.formatINR = formatINR;

// ── Format date ──────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
window.formatDate = formatDate;

// ── Generate star HTML ───────────────────────────────────────
function starsHtml(rating) {
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="star ${i < rating ? '' : 'empty'}">★</span>`
  ).join('');
}
window.starsHtml = starsHtml;

// ── Init on DOM ready ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initParticles();
  initMobileNav();
});
