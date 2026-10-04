/**
 * COOKIE AUTH & WORKSPACE ENGINE
 * Clinical Radiology Guide - Universal Auth & Storage Controller
 * 
 * Architecture:
 * 1. Anonymous First: Users can use the website without an account.
 *    - Save bookmarks locally (cookies & localStorage)
 *    - Track download history locally
 *    - Save theme and local preferences
 *    - No complicated "Local Account" terminology - simply browser storage
 * 2. Optional Google Authentication:
 *    - Cross-device synchronization of bookmarks, downloads, and preferences
 *    - Merges local data into Google account without overwriting or duplicates
 *    - Required ONLY for identity features (commenting)
 * 3. Theme Synchronization:
 *    - Current local theme is preserved upon Google sign-in
 *    - Local theme remains intact upon sign-out
 */

(function () {
  'use strict';

  // Cookie Names
  const COOKIE_SESSION = 'radiology_session';
  const COOKIE_BOOKMARKS = 'radiology_bookmarks';
  
  // Storage Keys
  const STORAGE_SESSION = 'my_radiology_user_session';
  const STORAGE_BOOKMARKS_PRIMARY = 'radiology_saved_posts';
  const STORAGE_BOOKMARKS_SECONDARY = 'radiology_saved_protocols';
  const STORAGE_DOWNLOADS = 'radiology_downloads_history_v1';
  const STORAGE_COMMENTS = 'radiology_post_comments_v1';
  const STORAGE_STREAK = 'radiology_study_streak';
  const STORAGE_THEME = 'app-theme-preference';

  // Cookie Utilities
  function setCookie(name, value, days = 365) {
    try {
      const d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      const expires = 'expires=' + d.toUTCString();
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const encoded = encodeURIComponent(stringValue);
      document.cookie = `${name}=${encoded}; ${expires}; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn('Cookie set error:', e);
    }
  }

  function getCookie(name) {
    try {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) {
          const raw = decodeURIComponent(c.substring(nameEQ.length));
          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        }
      }
    } catch (e) {
      console.warn('Cookie read error:', e);
    }
    return null;
  }

  function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  }

  /* ==========================================================================
     BOOKMARK MANAGEMENT (Browser Storage - Works Anonymously)
     ========================================================================== */

  const DEFAULT_INITIAL_BOOKMARKS = [
    'stroke-cta-protocol',
    'chest-hrct-interstitial',
    'physics-tube-rating'
  ];

  function getBookmarks() {
    let ids = [];
    
    // 1. Try reading from cookie first
    const cookieData = getCookie(COOKIE_BOOKMARKS);
    if (Array.isArray(cookieData)) {
      ids = cookieData;
    } else {
      // 2. Fallback to localStorage and migrate to cookie
      try {
        const raw1 = localStorage.getItem(STORAGE_BOOKMARKS_PRIMARY);
        const raw2 = localStorage.getItem(STORAGE_BOOKMARKS_SECONDARY);
        if (raw1) ids = ids.concat(JSON.parse(raw1));
        if (raw2) ids = ids.concat(JSON.parse(raw2));
      } catch (e) {}

      ids = Array.from(new Set(ids));

      // Seed initial defaults if completely empty
      if (ids.length === 0) {
        ids = [...DEFAULT_INITIAL_BOOKMARKS];
      }

      setCookie(COOKIE_BOOKMARKS, ids, 365);
    }

    // Mirror to localStorage for script compatibility
    try {
      localStorage.setItem(STORAGE_BOOKMARKS_PRIMARY, JSON.stringify(ids));
      localStorage.setItem(STORAGE_BOOKMARKS_SECONDARY, JSON.stringify(ids));
    } catch (e) {}

    return ids;
  }

  function saveBookmark(id) {
    if (!id) return;
    const current = getBookmarks();
    if (!current.includes(id)) {
      current.push(id);
      setCookie(COOKIE_BOOKMARKS, current, 365);
      try {
        localStorage.setItem(STORAGE_BOOKMARKS_PRIMARY, JSON.stringify(current));
        localStorage.setItem(STORAGE_BOOKMARKS_SECONDARY, JSON.stringify(current));
      } catch (e) {}
      
      // If user is signed in with Google, also sync to cloud copy
      const session = getSession();
      if (session && session.email) {
        try {
          localStorage.setItem('radiology_cloud_bookmarks_' + session.email, JSON.stringify(current));
        } catch (e) {}
      }

      dispatchBookmarkEvent();
    }
  }

  function removeBookmark(id) {
    if (!id) return;
    let current = getBookmarks();
    if (current.includes(id)) {
      current = current.filter(item => item !== id);
      setCookie(COOKIE_BOOKMARKS, current, 365);
      try {
        localStorage.setItem(STORAGE_BOOKMARKS_PRIMARY, JSON.stringify(current));
        localStorage.setItem(STORAGE_BOOKMARKS_SECONDARY, JSON.stringify(current));
      } catch (e) {}

      // If user is signed in with Google, also sync to cloud copy
      const session = getSession();
      if (session && session.email) {
        try {
          localStorage.setItem('radiology_cloud_bookmarks_' + session.email, JSON.stringify(current));
        } catch (e) {}
      }

      dispatchBookmarkEvent();
    }
  }

  function isBookmarked(id) {
    if (!id) return false;
    const list = getBookmarks();
    return list.includes(id);
  }

  function toggleBookmark(id) {
    if (isBookmarked(id)) {
      removeBookmark(id);
      return false;
    } else {
      saveBookmark(id);
      return true;
    }
  }

  function dispatchBookmarkEvent() {
    const list = getBookmarks();
    window.dispatchEvent(new CustomEvent('bookmarks-updated', { detail: { bookmarks: list, count: list.length } }));
  }

  /* ==========================================================================
     DOWNLOADS TRACKING (Browser Storage - Works Anonymously)
     ========================================================================== */

  const DEFAULT_INITIAL_DOWNLOADS = [
    {
      id: 'dl-physics-4th-ed',
      title: 'The Essential Physics of Medical Imaging (4th Edition Reference)',
      category: 'Diagnostic Physics',
      format: 'PDF',
      size: '48.2 MB',
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
      url: '/books/'
    },
    {
      id: 'dl-stroke-aspects-card',
      title: 'Acute Ischemic Stroke ASPECTS Multi-Phase CTA Quick Triage Card',
      category: 'Neuroradiology',
      format: 'PDF',
      size: '4.2 MB',
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5,
      url: '/post/index.html'
    },
    {
      id: 'dl-chest-ct-ild-atlas',
      title: 'High-Resolution Chest CT Interstitial Lung Disease Pattern Atlas',
      category: 'Thoracic Imaging',
      format: 'PDF',
      size: '32.6 MB',
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 9,
      url: '/books/'
    },
    {
      id: 'dl-msk-ultrasound-pocket',
      title: 'Dynamic Musculoskeletal Ultrasound & Rotator Cuff Pocket Companion',
      category: 'MSK Ultrasound',
      format: 'EPUB',
      size: '18.4 MB',
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 12,
      url: '/books/'
    }
  ];

  function getDownloads() {
    let list = [];
    try {
      const raw = localStorage.getItem(STORAGE_DOWNLOADS);
      if (raw) list = JSON.parse(raw);
    } catch (e) {}

    if (!Array.isArray(list) || list.length === 0) {
      list = [...DEFAULT_INITIAL_DOWNLOADS];
      try {
        localStorage.setItem(STORAGE_DOWNLOADS, JSON.stringify(list));
      } catch (e) {}
    }
    return list;
  }

  function saveDownload(item) {
    if (!item || !item.id) return;
    const current = getDownloads();
    const existingIndex = current.findIndex(d => d.id === item.id);
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...item, timestamp: Date.now() };
    } else {
      current.unshift({ ...item, timestamp: Date.now() });
    }
    try {
      localStorage.setItem(STORAGE_DOWNLOADS, JSON.stringify(current));
    } catch (e) {}

    // If user is signed in with Google, also sync to cloud copy
    const session = getSession();
    if (session && session.email) {
      try {
        localStorage.setItem('radiology_cloud_downloads_' + session.email, JSON.stringify(current));
      } catch (e) {}
    }

    window.dispatchEvent(new CustomEvent('downloads-updated', { detail: { downloads: current, count: current.length } }));
  }

  function removeDownload(id) {
    if (!id) return;
    let current = getDownloads();
    current = current.filter(d => d.id !== id);
    try {
      localStorage.setItem(STORAGE_DOWNLOADS, JSON.stringify(current));
    } catch (e) {}

    const session = getSession();
    if (session && session.email) {
      try {
        localStorage.setItem('radiology_cloud_downloads_' + session.email, JSON.stringify(current));
      } catch (e) {}
    }

    window.dispatchEvent(new CustomEvent('downloads-updated', { detail: { downloads: current, count: current.length } }));
  }

  /* ==========================================================================
     AUTHENTICATION & GOOGLE SYNCHRONIZATION
     ========================================================================== */

  /**
   * Retrieves active Google session, or null if user is anonymous.
   */
  function getSession() {
    let session = getCookie(COOKIE_SESSION);
    
    if (!session || typeof session !== 'object') {
      try {
        const raw = localStorage.getItem(STORAGE_SESSION);
        if (raw) session = JSON.parse(raw);
      } catch (e) {}
    }

    // Only recognize valid Google sessions (anonymous users have null session)
    if (session && typeof session === 'object' && (session.provider === 'google' || session.email)) {
      setCookie(COOKIE_SESSION, session, 365);
      try {
        localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
      } catch (e) {}
      return session;
    }

    return null;
  }

  /**
   * Google Sign-In & Synchronization
   * Merges:
   * - Bookmarks (no duplicates)
   * - Download history (no duplicates)
   * - Preserves current local theme as user's pending preference
   */
  function setGoogleAccount({ name, email, avatar, seed }) {
    const userEmail = email || 'mr.akshaypatel05@gmail.com';
    const userName = name || 'Akshay Patel';
    const userAvatar = avatar || (window.DiceBear && typeof window.DiceBear.getRandomAvatar === 'function' 
      ? window.DiceBear.getRandomAvatar(userEmail) 
      : '');

    // 1. Read existing local bookmarks
    const localBookmarks = getBookmarks();

    // 2. Read cloud bookmarks for this user if any
    let cloudBookmarks = [];
    try {
      const rawCloud = localStorage.getItem('radiology_cloud_bookmarks_' + userEmail);
      if (rawCloud) cloudBookmarks = JSON.parse(rawCloud);
    } catch (e) {}

    // Merge bookmarks (union, avoid duplicates)
    const mergedBookmarks = Array.from(new Set([...cloudBookmarks, ...localBookmarks]));
    setCookie(COOKIE_BOOKMARKS, mergedBookmarks, 365);
    try {
      localStorage.setItem(STORAGE_BOOKMARKS_PRIMARY, JSON.stringify(mergedBookmarks));
      localStorage.setItem(STORAGE_BOOKMARKS_SECONDARY, JSON.stringify(mergedBookmarks));
      localStorage.setItem('radiology_cloud_bookmarks_' + userEmail, JSON.stringify(mergedBookmarks));
    } catch (e) {}

    // 3. Read and merge download history
    const localDownloads = getDownloads();
    let cloudDownloads = [];
    try {
      const rawCloudDl = localStorage.getItem('radiology_cloud_downloads_' + userEmail);
      if (rawCloudDl) cloudDownloads = JSON.parse(rawCloudDl);
    } catch (e) {}

    const dlMap = new Map();
    cloudDownloads.forEach(d => { if (d && d.id) dlMap.set(d.id, d); });
    localDownloads.forEach(d => { if (d && d.id) dlMap.set(d.id, d); });
    const mergedDownloads = Array.from(dlMap.values());
    try {
      localStorage.setItem(STORAGE_DOWNLOADS, JSON.stringify(mergedDownloads));
      localStorage.setItem('radiology_cloud_downloads_' + userEmail, JSON.stringify(mergedDownloads));
    } catch (e) {}

    // 4. Preserve pending local theme preference
    let currentTheme = 'light';
    try {
      currentTheme = localStorage.getItem(STORAGE_THEME) || 
        ((window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');
      localStorage.setItem('radiology_cloud_theme_' + userEmail, currentTheme);
    } catch (e) {}

    const sessionData = {
      provider: 'google',
      isLocal: false,
      name: userName,
      email: userEmail,
      seed: seed || userEmail,
      avatar: userAvatar,
      isDicebear: true,
      canComment: true,
      joinedDate: 'September 25, 2026',
      timestamp: Date.now(),
      theme: currentTheme
    };

    setCookie(COOKIE_SESSION, sessionData, 365);
    try {
      localStorage.setItem(STORAGE_SESSION, JSON.stringify(sessionData));
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: sessionData }));
    window.dispatchEvent(new CustomEvent('bookmarks-updated', { detail: { bookmarks: mergedBookmarks, count: mergedBookmarks.length } }));
    window.dispatchEvent(new CustomEvent('downloads-updated', { detail: { downloads: mergedDownloads, count: mergedDownloads.length } }));

    return sessionData;
  }

  /**
   * One-click Google Sign-In helper
   */
  function signInWithGoogle(options = {}) {
    return setGoogleAccount({
      name: options.name || 'Akshay Patel',
      email: options.email || 'mr.akshaypatel05@gmail.com',
      avatar: options.avatar,
      seed: options.seed
    });
  }

  /**
   * Sign out (ends active Google session)
   * Keeps current local theme intact
   * Preserves local bookmarks and download history in browser
   */
  function clearSession() {
    const session = getSession();
    if (session && session.email) {
      try {
        localStorage.setItem('radiology_cloud_bookmarks_' + session.email, JSON.stringify(getBookmarks()));
        localStorage.setItem('radiology_cloud_downloads_' + session.email, JSON.stringify(getDownloads()));
      } catch (e) {}
    }

    // Preserve the current local theme
    const currentTheme = localStorage.getItem(STORAGE_THEME);

    deleteCookie(COOKIE_SESSION);
    try {
      localStorage.removeItem(STORAGE_SESSION);
      if (currentTheme) {
        localStorage.setItem(STORAGE_THEME, currentTheme);
      }
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: null }));
  }

  /**
   * Permissions: Only Google-authenticated users can comment.
   * Anonymous users cannot comment.
   */
  function canComment() {
    const session = getSession();
    return !!(session && session.provider === 'google' && session.email);
  }

  function isLoggedIn() {
    const session = getSession();
    return !!(session && session.provider === 'google' && session.email);
  }

  function isAnonymous() {
    return !isLoggedIn();
  }

  /**
   * Reset Account (Danger Action 1):
   * Clears saved application data (bookmarks, downloads, comments, streak)
   * while keeping profile intact.
   */
  function resetAccount() {
    // Clear bookmarks
    setCookie(COOKIE_BOOKMARKS, [], 365);
    try {
      localStorage.setItem(STORAGE_BOOKMARKS_PRIMARY, JSON.stringify([]));
      localStorage.setItem(STORAGE_BOOKMARKS_SECONDARY, JSON.stringify([]));
    } catch (e) {}

    // Clear downloads
    try {
      localStorage.setItem(STORAGE_DOWNLOADS, JSON.stringify([]));
    } catch (e) {}

    // Clear comments
    try {
      localStorage.setItem(STORAGE_COMMENTS, JSON.stringify([]));
    } catch (e) {}

    // Reset study streak
    try {
      localStorage.setItem(STORAGE_STREAK, '0');
    } catch (e) {}

    // If Google user, also reset their cloud data copy
    const session = getSession();
    if (session && session.email) {
      try {
        localStorage.setItem('radiology_cloud_bookmarks_' + session.email, JSON.stringify([]));
        localStorage.setItem('radiology_cloud_downloads_' + session.email, JSON.stringify([]));
      } catch (e) {}
    }

    dispatchBookmarkEvent();
    window.dispatchEvent(new CustomEvent('downloads-updated', { detail: { downloads: [], count: 0 } }));
    return true;
  }

  /**
   * Delete Google Account (Danger Action 2):
   * Permanently deletes Google-connected user data and ends Google session.
   * Reverts user to clean anonymous browser mode.
   */
  function deleteGoogleAccount() {
    const session = getSession();
    if (session && session.email) {
      try {
        localStorage.removeItem('radiology_cloud_bookmarks_' + session.email);
        localStorage.removeItem('radiology_cloud_downloads_' + session.email);
        localStorage.removeItem('radiology_cloud_theme_' + session.email);
      } catch (e) {}
    }

    // Keep current theme preference locally
    const currentTheme = localStorage.getItem(STORAGE_THEME);

    deleteCookie(COOKIE_SESSION);
    try {
      localStorage.removeItem(STORAGE_SESSION);
      if (currentTheme) {
        localStorage.setItem(STORAGE_THEME, currentTheme);
      }
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: null }));
    return true;
  }

  // Toast Notification Helper (Delegates to unified Toast module)
  function showToast(message, type = 'info', options = {}) {
    if (window.Toast && typeof window.Toast.show === 'function') {
      return window.Toast.show(message, type, options);
    }
    if (window.showToast && window.showToast !== showToast) {
      return window.showToast(message, type, options);
    }
    // Fallback if toast module hasn't loaded yet
    console.log(`[Toast ${type}]:`, message);
  }

  // Backwards compatibility shim for any existing code calling old local methods
  function createLocalAccount() {
    return null;
  }
  function loginOrRestoreLocalAccount() {
    return { session: null, isExisting: false };
  }
  function findStoredAccount() {
    return null;
  }

  // Expose universal API
  window.RadiologyAuth = {
    // Cookie Helpers
    setCookie,
    getCookie,
    deleteCookie,

    // Bookmarks API (Local / Cookie)
    getBookmarks,
    saveBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark,

    // Downloads API (Local)
    getDownloads,
    saveDownload,
    removeDownload,

    // Authentication & Google Sync API
    getSession,
    signInWithGoogle,
    setGoogleAccount,
    clearSession,
    resetAccount,
    deleteGoogleAccount,
    deleteAccount: deleteGoogleAccount, // alias for backwards compatibility
    isLoggedIn,
    isAnonymous,
    canComment,

    // Backwards compatibility
    createLocalAccount,
    loginOrRestoreLocalAccount,
    findStoredAccount,

    // UI Helper
    showToast
  };

  // Sync initial bookmarks on boot
  document.addEventListener('DOMContentLoaded', () => {
    getBookmarks();
    getDownloads();
  });

})();
