// theme.js - Handles dark/light mode switching and system preference detection

(function() {
  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    updateToggleIcon(theme);
  }

  function updateToggleIcon(theme) {
    // We update icons if the DOM is ready. 
    // If called in <head>, elements might not exist yet, so we listen for DOMContentLoaded.
    const update = () => {
      document.querySelectorAll('.theme-toggle-icon').forEach(icon => {
        icon.textContent = theme === 'light' ? '🌙' : '☀️';
      });
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', update);
    } else {
      update();
    }
  }

  // 1. Check local storage
  let currentTheme = localStorage.getItem('theme');
  
  // 2. If no local storage, check system preference
  if (!currentTheme) {
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    currentTheme = prefersLight ? 'light' : 'dark';
  }

  // Apply immediately to prevent FOUC
  applyTheme(currentTheme);

  // Expose toggle function to window
  window.toggleTheme = function() {
    const isLight = document.documentElement.classList.contains('light-theme');
    const newTheme = isLight ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };
})();
