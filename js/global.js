/**
 * GLOBAL JS
 * Handles global application logic, theme switching (dark/light mode),
 * Material-style subtle color palettes (default: beige),
 * local persistence, and custom theme/palette change events.
 */

(function () {
  'use strict';

  const STORAGE_KEY_THEME = 'app-theme-preference';
  const STORAGE_KEY_PALETTE = 'app-palette-preference';

  const VALID_THEMES = ['light', 'dark', 'extra-dark'];

  const VALID_PALETTES = [
    'beige',
    'green',
    'orange',
    'blue',
    'teal',
    'brown',
    'pink',
    'purple',
    'magenta',
    'red',
  ];

  const DEFAULT_PALETTE = 'beige';

  /**
   * Determine the current active theme
   * Priority: 1. Stored user preference in localStorage
   *           2. System media query prefers-color-scheme
   *           3. Default fallback to 'light'
   * @returns {'light' | 'dark' | 'extra-dark'}
   */
  function getPreferredTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (savedTheme && VALID_THEMES.includes(savedTheme)) {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Determine the current active color palette
   * Priority: 1. Stored user preference in localStorage
   *           2. Default fallback to 'beige'
   * @returns {string}
   */
  function getPreferredPalette() {
    const savedPalette = localStorage.getItem(STORAGE_KEY_PALETTE);
    if (savedPalette && VALID_PALETTES.includes(savedPalette)) {
      return savedPalette;
    }
    return DEFAULT_PALETTE;
  }

  /**
   * Temporarily disables all CSS transitions across the entire DOM during theme/palette updates.
   * This eliminates the severe frame drops and jank caused by hundreds of elements and backdrop-filter
   * blurs attempting to interpolate CSS custom properties simultaneously.
   * @param {() => void} fn
   */
  function withoutTransitions(fn) {
    const css = document.createElement('style');
    css.setAttribute('type', 'text/css');
    css.textContent = '*, *::before, *::after { -webkit-transition: none !important; -moz-transition: none !important; -ms-transition: none !important; -o-transition: none !important; transition: none !important; animation: none !important; }';
    document.head.appendChild(css);

    try {
      fn();
    } finally {
      // Force instantaneous style recalculation with transitions suppressed
      void document.documentElement.offsetHeight;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (css.parentNode) {
            css.parentNode.removeChild(css);
          }
        });
      });
    }
  }

  /**
   * Apply theme to document element
   * @param {'light' | 'dark'} theme 
   * @param {boolean} persist 
   */
  function applyTheme(theme, persist = true) {
    withoutTransitions(() => {
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);

      if (persist) {
        localStorage.setItem(STORAGE_KEY_THEME, theme);
      }

      // Update buttons with data-current-theme
      const modeButtons = document.querySelectorAll('[data-role="theme-toggle"], #mode-btn');
      modeButtons.forEach((btn) => {
        btn.setAttribute('data-current-theme', theme);
        btn.setAttribute('aria-label', `Theme & Palette settings (currently ${theme} mode)`);
      });

      // Update active state on any theme radio buttons in the modal
      const modeSelectButtons = document.querySelectorAll('.mode-select-btn');
      modeSelectButtons.forEach((btn) => {
        const modeVal = btn.getAttribute('data-mode-val');
        const isSelected = modeVal === theme;
        btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        if (isSelected) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });

      window.dispatchEvent(
        new CustomEvent('themechange', {
          detail: { theme },
        })
      );
    });
  }

  /**
   * Apply color palette to document element
   * @param {string} palette 
   * @param {boolean} persist 
   */
  function applyPalette(palette, persist = true) {
    withoutTransitions(() => {
      const valid = VALID_PALETTES.includes(palette) ? palette : DEFAULT_PALETTE;
      const root = document.documentElement;
      root.setAttribute('data-palette', valid);

      if (persist) {
        localStorage.setItem(STORAGE_KEY_PALETTE, valid);
      }

      // Update active state in palette UI
      const paletteButtons = document.querySelectorAll('.palette-btn');
      paletteButtons.forEach((btn) => {
        const pVal = btn.getAttribute('data-palette-val');
        const isSelected = pVal === valid;
        btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        if (isSelected) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });

      // Update active label display
      const currentPaletteLabel = document.getElementById('current-palette-name');
      if (currentPaletteLabel) {
        currentPaletteLabel.textContent = valid.charAt(0).toUpperCase() + valid.slice(1);
      }

      window.dispatchEvent(
        new CustomEvent('palettechange', {
          detail: { palette: valid },
        })
      );
    });
  }

  /**
   * Toggle between light, dark, and extra-dark themes
   * @returns {'light' | 'dark' | 'extra-dark'} The new active theme
   */
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    let newTheme = 'light';
    if (currentTheme === 'light') {
      newTheme = 'dark';
    } else if (currentTheme === 'dark') {
      newTheme = 'extra-dark';
    } else {
      newTheme = 'light';
    }
    applyTheme(newTheme, true);
    return newTheme;
  }

  // Expose global API
  window.GlobalTheme = {
    getTheme: () => document.documentElement.getAttribute('data-theme') || getPreferredTheme(),
    setTheme: applyTheme,
    toggleTheme: toggleTheme,
    getPalette: () => document.documentElement.getAttribute('data-palette') || getPreferredPalette(),
    setPalette: applyPalette,
    THEMES: VALID_THEMES,
    PALETTES: VALID_PALETTES,
  };

  // Immediate initialization to avoid flash of unstyled content
  const initialTheme = getPreferredTheme();
  const initialPalette = getPreferredPalette();
  applyTheme(initialTheme, false);
  applyPalette(initialPalette, false);

  // Listen for OS system theme changes if user has not explicitly set a preference
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      const userStored = localStorage.getItem(STORAGE_KEY_THEME);
      if (!userStored) {
        applyTheme(e.matches ? 'dark' : 'light', false);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange);
    }
  }

  // Sync button and UI states once DOM is fully loaded
  document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    const currentPalette = document.documentElement.getAttribute('data-palette') || getPreferredPalette();
    applyTheme(currentTheme, false);
    applyPalette(currentPalette, false);
  });
})();
