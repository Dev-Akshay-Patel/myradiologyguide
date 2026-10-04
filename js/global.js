/**
 * GLOBAL JS
 * Handles global application logic, theme switching (dark/light/extra-dark mode),
 * Material-style subtle color palettes, user-created custom palettes via color picker,
 * central site configuration (sidebar, header nav, search suggestions, topics order, carousel, footer),
 * and network connectivity monitoring.
 */

(function () {
  'use strict';

  const STORAGE_KEY_THEME = 'app-theme-preference';
  const STORAGE_KEY_PALETTE = 'app-palette-preference';
  const STORAGE_KEY_CUSTOM_PALETTES = 'radiology_custom_palettes';
  const STORAGE_KEY_SITE_CONFIG = 'radiology_site_config';

  const VALID_THEMES = ['light', 'dark', 'extra-dark'];

  const BUILTIN_PALETTES = [
    'default',
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

  const DEFAULT_PALETTE = 'default';

  // Default Site Config Fallbacks
  const DEFAULT_SITE_CONFIG = {
    sidebar: [
      { id: 'popular', label: 'Popular Protocols', enabled: true, title: 'Popular Protocols' },
      { id: 'topics', label: 'Clinical Taxonomies', enabled: true, title: 'Explore Topics' },
      { id: 'books', label: 'Recommended Books', enabled: true, title: 'Best Radiology Books' },
      { id: 'tools', label: 'Clinical Reference Tools', enabled: true, title: 'Quick Diagnostic Tools' }
    ],
    headerNav: [
      { id: 'nav-protocols', title: 'Protocols', url: '/index.html' },
      { id: 'nav-books', title: 'Best Books', url: '/books/' },
      { id: 'nav-admin', title: 'Admin CMS', url: '/admin/' }
    ],
    searchSuggestions: [
      'Acute Stroke CTA',
      'Cardiac MRI Viability',
      'Chest CT Pulmonary Embolism',
      'Knee MRI Meniscal Tear',
      'Liver LI-RADS Lesion',
      'Prostate PI-RADS Atlas',
      'CT Trauma Protocol',
      'Thyroid TI-RADS'
    ],
    topicsOrder: [
      'Neuroradiology',
      'Cardiac MRI',
      'Chest CT',
      'Emergency',
      'Musculoskeletal',
      'Nuclear Medicine',
      'Interventional',
      'Pediatrics',
      'Abdominal',
      'Radiation Safety',
      'Ultrasound',
      'Head & Neck'
    ],
    carousel: [
      {
        id: 'slide-1',
        tag: 'Neuroradiology',
        title: 'Multiphase Stroke CTA & ASPECTS Protocol',
        desc: 'Rapid collateral grading, early ischemic core mapping, and standardized acute triage.',
        image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&auto=format&fit=crop&q=80',
        link: '/post/?id=neuroradiology-stroke-cta'
      },
      {
        id: 'slide-2',
        tag: 'Cardiac MRI',
        title: 'Late Gadolinium Enhancement Atlas',
        desc: 'Ischemic vs non-ischemic myocardial scar patterns, T1/T2 mapping thresholds.',
        image: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1600&auto=format&fit=crop&q=80',
        link: '/post/?id=cardiac-mri-viability'
      },
      {
        id: 'slide-3',
        tag: 'Chest CT',
        title: 'High-Resolution Interstitial Lung Disease',
        desc: 'UIP vs NSIP morphological criteria, traction bronchiectasis, and honeycombing.',
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&auto=format&fit=crop&q=80',
        link: '/post/?id=chest-ct-ild'
      },
      {
        id: 'slide-4',
        tag: 'Emergency',
        title: 'Whole-Body Polytrauma CT Protocol',
        desc: 'Split-bolus arterial-venous single acquisition, active hemorrhage identification.',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&auto=format&fit=crop&q=80',
        link: '/post/?id=emergency-polytrauma-ct'
      }
    ],
    footer: {
      bio: 'Peer-reviewed, evidence-based imaging algorithms, triage decision trees, and diagnostic criteria for radiologists and clinical specialists.',
      copyright: '© 2026 My Radiology Guide. Standardized for clinicians.',
      disclaimer: 'For educational and clinical reference only. Verify critical findings with hospital protocol.'
    }
  };

  /**
   * Load Site Config
   */
  function loadSiteConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SITE_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SITE_CONFIG, ...parsed };
      }
    } catch (e) {
      console.warn('Could not read site config from localStorage', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SITE_CONFIG));
  }

  /**
   * Save Site Config
   */
  function saveSiteConfig(newConfig) {
    try {
      const current = loadSiteConfig();
      const merged = { ...current, ...newConfig };
      localStorage.setItem(STORAGE_KEY_SITE_CONFIG, JSON.stringify(merged, null, 2));
      window.MRG_CONFIG = merged;
      window.dispatchEvent(new CustomEvent('mrgconfigchange', { detail: merged }));
      return merged;
    } catch (e) {
      console.error('Error saving site config', e);
      return null;
    }
  }

  /**
   * Load Custom Palettes from LocalStorage
   */
  function loadCustomPalettes() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_PALETTES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read custom palettes', e);
    }
    return [];
  }

  function saveCustomPalettes(palettesList) {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_PALETTES, JSON.stringify(palettesList, null, 2));
      applyCustomPaletteStyles();
    } catch (e) {
      console.error('Error saving custom palettes', e);
    }
  }

  /**
   * Inject dynamic CSS variables for all custom palettes
   */
  function applyCustomPaletteStyles() {
    let styleEl = document.getElementById('mrg-custom-palettes-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'mrg-custom-palettes-styles';
      document.head.appendChild(styleEl);
    }

    const customPalettes = loadCustomPalettes();
    let cssText = '';

    customPalettes.forEach((p) => {
      if (!p.id || !p.accent) return;
      cssText += `
        [data-palette="${p.id}"] {
          --accent-color: ${p.accent};
          ${p.bgBody ? `--color-bg-body: ${p.bgBody};` : ''}
          ${p.bgSurface ? `--color-bg-surface: ${p.bgSurface};` : ''}
          ${p.text ? `--color-text-primary: ${p.text};` : ''}
          ${p.border ? `--color-border: ${p.border};` : ''}
          ${p.bgSurface ? `--Mainbg: ${p.bgSurface};` : ''}
          ${p.text ? `--color: ${p.text};` : ''}
          ${p.border ? `--border: 1px solid ${p.border};` : ''}
        }
      `;
    });

    styleEl.textContent = cssText;
  }

  /**
   * Determine preferred theme
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
   * Determine preferred palette
   */
  function getPreferredPalette() {
    const savedPalette = localStorage.getItem(STORAGE_KEY_PALETTE);
    const custom = loadCustomPalettes();
    const customIds = custom.map((c) => c.id);
    const valid = [...BUILTIN_PALETTES, ...customIds];

    if (savedPalette && valid.includes(savedPalette)) {
      return savedPalette;
    }
    return DEFAULT_PALETTE;
  }

  /**
   * Temporarily disable CSS transitions during theme/palette change
   */
  function withoutTransitions(fn) {
    const css = document.createElement('style');
    css.setAttribute('type', 'text/css');
    css.textContent = '*, *::before, *::after { -webkit-transition: none !important; -moz-transition: none !important; -ms-transition: none !important; -o-transition: none !important; transition: none !important; }';
    document.head.appendChild(css);

    try {
      fn();
    } finally {
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
   * Apply theme to root document
   */
  function applyTheme(theme, persist = true) {
    withoutTransitions(() => {
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);

      if (persist) {
        localStorage.setItem(STORAGE_KEY_THEME, theme);
      }

      const modeButtons = document.querySelectorAll('[data-role="theme-toggle"], #mode-btn');
      modeButtons.forEach((btn) => {
        btn.setAttribute('data-current-theme', theme);
        btn.setAttribute('aria-label', `Theme & Palette settings (currently ${theme} mode)`);
      });

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
   * Apply palette to root document
   */
  function applyPalette(palette, persist = true) {
    withoutTransitions(() => {
      const custom = loadCustomPalettes();
      const customIds = custom.map((c) => c.id);
      const validList = [...BUILTIN_PALETTES, ...customIds];
      const valid = validList.includes(palette) ? palette : DEFAULT_PALETTE;

      const root = document.documentElement;
      root.setAttribute('data-palette', valid);

      if (persist) {
        localStorage.setItem(STORAGE_KEY_PALETTE, valid);
      }

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

  // Global Config Instance
  window.MRG_CONFIG = loadSiteConfig();

  // Expose global API
  window.GlobalTheme = {
    getTheme: () => document.documentElement.getAttribute('data-theme') || getPreferredTheme(),
    setTheme: applyTheme,
    toggleTheme: toggleTheme,
    getPalette: () => document.documentElement.getAttribute('data-palette') || getPreferredPalette(),
    setPalette: applyPalette,
    THEMES: VALID_THEMES,
    BUILTIN_PALETTES,
    getCustomPalettes: loadCustomPalettes,
    saveCustomPalettes: saveCustomPalettes,
    addCustomPalette: (pal) => {
      const list = loadCustomPalettes().filter((p) => p.id !== pal.id);
      list.push(pal);
      saveCustomPalettes(list);
      applyPalette(pal.id, true);
    },
    deleteCustomPalette: (id) => {
      const list = loadCustomPalettes().filter((p) => p.id !== id);
      saveCustomPalettes(list);
      if (getPreferredPalette() === id) {
        applyPalette(DEFAULT_PALETTE, true);
      }
    }
  };

  window.MRG_CONFIG_API = {
    get: loadSiteConfig,
    save: saveSiteConfig,
    updateSection: (sectionKey, data) => {
      const cfg = loadSiteConfig();
      cfg[sectionKey] = data;
      return saveSiteConfig(cfg);
    }
  };

  // Immediate initialization
  applyCustomPaletteStyles();
  const initialTheme = getPreferredTheme();
  const initialPalette = getPreferredPalette();
  applyTheme(initialTheme, false);
  applyPalette(initialPalette, false);

  // System theme changes listener
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

  // DOM ready sync
  document.addEventListener('DOMContentLoaded', () => {
    applyCustomPaletteStyles();
    const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    const currentPalette = document.documentElement.getAttribute('data-palette') || getPreferredPalette();
    applyTheme(currentTheme, false);
    applyPalette(currentPalette, false);
  });

  /* --------------------------------------------------------------------------
     Internet Connectivity Status (Online / Offline)
     -------------------------------------------------------------------------- */
  function handleNetworkChange(isOnline) {
    if (typeof window.showToast !== 'function' && typeof window.Toast?.show !== 'function') {
      return;
    }

    const toastFn = window.Toast || {
      online: (msg, dur, id) => window.showToast(msg, 'wifi', dur, id),
      offline: (msg, dur, id) => window.showToast(msg, 'no-network', dur, id)
    };

    if (isOnline) {
      toastFn.online(
        "Internet connection restored. You're back online.",
        4500,
        "internet-connection-status"
      );
    } else {
      toastFn.offline(
        "No internet connection. You are currently browsing offline.",
        0,
        "internet-connection-status"
      );
    }

    window.dispatchEvent(
      new CustomEvent('networkstatuschange', {
        detail: { online: isOnline }
      })
    );
  }

  window.addEventListener('online', () => handleNetworkChange(true));
  window.addEventListener('offline', () => handleNetworkChange(false));

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setTimeout(() => handleNetworkChange(false), 500);
    }
  });

  window.NetworkStatus = {
    isOnline: () => typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
})();
