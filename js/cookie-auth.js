/**
 * COOKIE AUTH & BOOKMARKS ENGINE
 * Clinical Radiology Guide - Universal Auth & Storage Controller
 * 
 * Supports:
 * 1. 100% Cookie-based Local Account (Zero server upload, private, customizable name & avatar)
 * 2. Google Account authentication (Ready for future Firebase integration)
 * 3. Cookie-based Bookmark system synced across the entire site and reflected in User Account
 * 4. Local Downloads tracking
 * 5. Permission checks (Local accounts cannot comment; Google accounts can comment)
 */

(function () {
  'use strict';

  // Cookie Names
  const COOKIE_SESSION = 'radiology_session';
  const COOKIE_BOOKMARKS = 'radiology_bookmarks';
  
  // Storage Keys for backward compatibility and fast cache
  const STORAGE_SESSION = 'my_radiology_user_session';
  const STORAGE_BOOKMARKS_PRIMARY = 'radiology_saved_posts';
  const STORAGE_BOOKMARKS_SECONDARY = 'radiology_saved_protocols';
  const STORAGE_DOWNLOADS = 'radiology_downloads_history_v1';
  const STORAGE_LOCAL_ACCOUNTS_VAULT = 'radiology_local_accounts_vault_v1';

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
     PERMANENT LOCAL ACCOUNTS VAULT (Separation of Account vs Session)
     Account = Permanent user identity + profile + saved data
     Session = Temporary state indicating that the user is currently logged in
     ========================================================================== */

  function getVault() {
    try {
      const raw = localStorage.getItem(STORAGE_LOCAL_ACCOUNTS_VAULT);
      if (raw) return JSON.parse(raw) || {};
    } catch (e) {}
    return {};
  }

  function saveVault(vault) {
    try {
      localStorage.setItem(STORAGE_LOCAL_ACCOUNTS_VAULT, JSON.stringify(vault || {}));
    } catch (e) {}
  }

  function normalizeAccountKey(name) {
    return (name || '').trim().toLowerCase();
  }

  function findStoredAccount(name) {
    if (!name) return null;
    const vault = getVault();
    const key = normalizeAccountKey(name);
    return vault[key] || null;
  }

  function saveCurrentActiveStateToVault() {
    const session = getSession();
    if (!session || (!session.isLocal && session.provider !== 'local') || !session.name) {
      return;
    }

    const vault = getVault();
    const key = normalizeAccountKey(session.name);

    const bookmarks = getBookmarks();
    let downloads = [];
    try {
      const dlRaw = localStorage.getItem(STORAGE_DOWNLOADS);
      if (dlRaw) downloads = JSON.parse(dlRaw);
    } catch (e) {}

    let comments = [];
    try {
      const cmRaw = localStorage.getItem('radiology_post_comments_v1');
      if (cmRaw) comments = JSON.parse(cmRaw);
    } catch (e) {}

    let streak = 14;
    try {
      const stRaw = localStorage.getItem('radiology_study_streak');
      if (stRaw !== null) streak = parseInt(stRaw, 10);
    } catch (e) {}

    vault[key] = {
      name: session.name,
      avatar: session.avatar || '',
      avatarType: session.avatarType || 'preset',
      avatarSeed: session.avatarSeed || 'radiology',
      joinedDate: session.joinedDate || 'September 25, 2026',
      timestamp: session.timestamp || Date.now(),
      bookmarks: bookmarks,
      downloads: downloads,
      comments: comments,
      streak: isNaN(streak) ? 14 : streak
    };

    saveVault(vault);
  }

  /* ==========================================================================
     BOOKMARK MANAGEMENT (Cookie-Based)
     ========================================================================== */

  // Initial seed IDs to showcase bookmarks if none exist
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

      const session = getSession();
      if (session && ids.length === 0) {
        ids = [...DEFAULT_INITIAL_BOOKMARKS];
      }

      setCookie(COOKIE_BOOKMARKS, ids, 365);
    }

    // Mirror to localStorage for existing script compatibility
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
      saveCurrentActiveStateToVault();
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
      saveCurrentActiveStateToVault();
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
     SESSION & LOCAL ACCOUNT MANAGEMENT (Cookie-Based)
     ========================================================================== */

  function getSession() {
    // 1. Try reading session from cookie
    let session = getCookie(COOKIE_SESSION);
    
    // 2. Fallback to localStorage if cookie empty
    if (!session || typeof session !== 'object') {
      try {
        const raw = localStorage.getItem(STORAGE_SESSION);
        if (raw) session = JSON.parse(raw);
      } catch (e) {}
    }

    // If session exists in either, keep both in sync
    if (session && typeof session === 'object') {
      setCookie(COOKIE_SESSION, session, 365);
      try {
        localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
      } catch (e) {}
      return session;
    }

    return null;
  }

  /**
   * Login or restore a local account:
   * 1. If username exists: find existing account and restore profile & saved data without creating new account.
   * 2. If username is new: create a new account in vault.
   */
  function loginOrRestoreLocalAccount({ name, avatar, avatarType = 'preset', avatarSeed = 'local-user' }) {
    const cleanName = (name && name.trim()) ? name.trim() : 'Clinical Radiologist';
    const existing = findStoredAccount(cleanName);

    let sessionData = null;

    if (existing) {
      // Restore existing account profile and saved data
      sessionData = {
        provider: 'local',
        isLocal: true,
        name: existing.name || cleanName,
        email: '',
        avatar: existing.avatar || avatar || (window.DiceBear && typeof window.DiceBear.getRandomAvatar === 'function' ? window.DiceBear.getRandomAvatar(cleanName) : ''),
        avatarType: existing.avatarType || avatarType,
        avatarSeed: existing.avatarSeed || avatarSeed,
        canComment: false,
        joinedDate: existing.joinedDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        timestamp: existing.timestamp || Date.now()
      };

      // Restore saved application data (Bookmarks, Downloads, Comments, Streak)
      const restoredBookmarks = Array.isArray(existing.bookmarks) ? existing.bookmarks : [...DEFAULT_INITIAL_BOOKMARKS];
      setCookie(COOKIE_BOOKMARKS, restoredBookmarks, 365);
      try {
        localStorage.setItem(STORAGE_BOOKMARKS_PRIMARY, JSON.stringify(restoredBookmarks));
        localStorage.setItem(STORAGE_BOOKMARKS_SECONDARY, JSON.stringify(restoredBookmarks));
      } catch (e) {}

      if (Array.isArray(existing.downloads)) {
        try {
          localStorage.setItem(STORAGE_DOWNLOADS, JSON.stringify(existing.downloads));
        } catch (e) {}
      }

      if (Array.isArray(existing.comments)) {
        try {
          localStorage.setItem('radiology_post_comments_v1', JSON.stringify(existing.comments));
        } catch (e) {}
      }

      if (existing.streak !== undefined) {
        try {
          localStorage.setItem('radiology_study_streak', String(existing.streak));
        } catch (e) {}
      }
    } else {
      // Create a brand new account in the vault
      const finalAvatar = avatar || (window.DiceBear && typeof window.DiceBear.getRandomAvatar === 'function' ? window.DiceBear.getRandomAvatar(cleanName) : '');
      const initialBookmarks = [...DEFAULT_INITIAL_BOOKMARKS];
      const initialDownloads = [
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
        }
      ];

      sessionData = {
        provider: 'local',
        isLocal: true,
        name: cleanName,
        email: '',
        avatar: finalAvatar,
        avatarType: avatarType,
        avatarSeed: avatarSeed,
        canComment: false,
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        timestamp: Date.now()
      };

      setCookie(COOKIE_BOOKMARKS, initialBookmarks, 365);
      try {
        localStorage.setItem(STORAGE_BOOKMARKS_PRIMARY, JSON.stringify(initialBookmarks));
        localStorage.setItem(STORAGE_BOOKMARKS_SECONDARY, JSON.stringify(initialBookmarks));
        localStorage.setItem(STORAGE_DOWNLOADS, JSON.stringify(initialDownloads));
        localStorage.setItem('radiology_study_streak', '14');
      } catch (e) {}

      // Save initial account in vault
      const vault = getVault();
      vault[normalizeAccountKey(cleanName)] = {
        name: cleanName,
        avatar: finalAvatar,
        avatarType: avatarType,
        avatarSeed: avatarSeed,
        joinedDate: sessionData.joinedDate,
        timestamp: sessionData.timestamp,
        bookmarks: initialBookmarks,
        downloads: initialDownloads,
        comments: [],
        streak: 14
      };
      saveVault(vault);
    }

    // Set active session
    setCookie(COOKIE_SESSION, sessionData, 365);
    try {
      localStorage.setItem(STORAGE_SESSION, JSON.stringify(sessionData));
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('bookmarks-updated', { detail: { bookmarks: getBookmarks(), count: getBookmarks().length } }));
    window.dispatchEvent(new CustomEvent('downloads-updated', { detail: { count: 0 } }));
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: sessionData }));

    return { session: sessionData, isExisting: !!existing };
  }

  /**
   * Alias for createLocalAccount to ensure existing code works seamlessly
   */
  function createLocalAccount(params) {
    const result = loginOrRestoreLocalAccount(params);
    return result.session;
  }

  /**
   * Save a Google Account session (for future Firebase integration)
   */
  function setGoogleAccount({ name, email, avatar, seed }) {
    const userEmail = email || 'mr.akshaypatel05@gmail.com';
    const userName = name || 'Akshay Patel';
    const userAvatar = avatar || (window.DiceBear && typeof window.DiceBear.getRandomAvatar === 'function' ? window.DiceBear.getRandomAvatar(userEmail) : '');

    const sessionData = {
      provider: 'google',
      isLocal: false,
      name: userName,
      email: userEmail,
      seed: seed || userEmail,
      avatar: userAvatar,
      isDicebear: true,
      style: 'glyphs',
      canComment: true,
      joinedDate: 'September 25, 2026',
      timestamp: Date.now()
    };

    setCookie(COOKIE_SESSION, sessionData, 365);
    try {
      localStorage.setItem(STORAGE_SESSION, JSON.stringify(sessionData));
    } catch (e) {}

    getBookmarks();

    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: sessionData }));
    return sessionData;
  }

  /**
   * Update current profile details (for local account avatar/name updates)
   */
  function updateProfile({ name, avatar, avatarType, avatarSeed }) {
    const current = getSession();
    if (!current) return null;

    const oldName = current.name;

    if (name !== undefined && name.trim()) {
      current.name = name.trim();
    }
    if (avatar !== undefined) {
      current.avatar = avatar;
    }
    if (avatarType !== undefined) {
      current.avatarType = avatarType;
    }
    if (avatarSeed !== undefined) {
      current.avatarSeed = avatarSeed;
    }

    setCookie(COOKIE_SESSION, current, 365);
    try {
      localStorage.setItem(STORAGE_SESSION, JSON.stringify(current));
    } catch (e) {}

    // Update vault
    if (current.isLocal || current.provider === 'local') {
      const vault = getVault();
      const oldKey = normalizeAccountKey(oldName);
      const newKey = normalizeAccountKey(current.name);

      const existingRecord = vault[oldKey] || {};
      if (oldKey !== newKey && oldKey) {
        delete vault[oldKey];
      }

      vault[newKey] = {
        ...existingRecord,
        name: current.name,
        avatar: current.avatar,
        avatarType: current.avatarType,
        avatarSeed: current.avatarSeed
      };
      saveVault(vault);
    }

    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: current }));
    return current;
  }

  /**
   * Clear session (Logout)
   * MUST ONLY end the current login/session.
   * MUST NOT delete the account, username, profile picture, saved data, progress, or settings.
   */
  function clearSession() {
    // 1. Save all current state to the persistent account vault before destroying the session
    saveCurrentActiveStateToVault();

    // 2. Clear ONLY the active session token/cookies
    deleteCookie(COOKIE_SESSION);
    try {
      localStorage.removeItem(STORAGE_SESSION);
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: null }));
  }

  /**
   * Check if current user is permitted to comment
   * Rule: Local accounts CANNOT comment. Only Google accounts can comment.
   */
  function canComment() {
    const session = getSession();
    if (!session) return false;
    if (session.isLocal === true || session.provider === 'local') return false;
    return session.canComment === true || session.provider === 'google';
  }

  function isLocalAccount() {
    const session = getSession();
    return !!(session && (session.isLocal === true || session.provider === 'local'));
  }

  function isLoggedIn() {
    const session = getSession();
    return !!(session && (session.name || session.email));
  }

  /**
   * Revoke all tokens & active sessions
   */
  function revokeAllTokens() {
    deleteCookie(COOKIE_SESSION);
    deleteCookie('radiology_token');
    deleteCookie('radiology_refresh_token');
    try {
      localStorage.removeItem(STORAGE_SESSION);
      localStorage.removeItem('radiology_auth_token');
      localStorage.removeItem('radiology_token_timestamp');
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: null }));
  }

  /**
   * Reset account:
   * Resets your app data while keeping your profile.
   */
  function resetAccount() {
    // Clear bookmarks
    setCookie(COOKIE_BOOKMARKS, [], 365);
    try {
      localStorage.setItem(STORAGE_BOOKMARKS_PRIMARY, JSON.stringify([]));
      localStorage.setItem(STORAGE_BOOKMARKS_SECONDARY, JSON.stringify([]));
    } catch (e) {}
    dispatchBookmarkEvent();

    // Clear downloads
    try {
      localStorage.setItem(STORAGE_DOWNLOADS, JSON.stringify([]));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('downloads-updated', { detail: { downloads: [], count: 0 } }));

    // Clear comments
    try {
      localStorage.setItem('radiology_post_comments_v1', JSON.stringify([]));
    } catch (e) {}

    // Reset streak
    try {
      localStorage.setItem('radiology_study_streak', '0');
    } catch (e) {}

    // Keep profile intact in session and vault
    const current = getSession();
    if (current && (current.isLocal || current.provider === 'local')) {
      const vault = getVault();
      const key = normalizeAccountKey(current.name);
      if (vault[key]) {
        vault[key].bookmarks = [];
        vault[key].downloads = [];
        vault[key].comments = [];
        vault[key].streak = 0;
        saveVault(vault);
      }
    }

    return true;
  }

  /**
   * Delete account:
   * Permanently deletes your account and all associated data.
   */
  function deleteAccount() {
    const current = getSession();
    if (current && (current.isLocal || current.provider === 'local') && current.name) {
      const vault = getVault();
      const key = normalizeAccountKey(current.name);
      delete vault[key];
      saveVault(vault);
    }

    deleteCookie(COOKIE_SESSION);
    deleteCookie(COOKIE_BOOKMARKS);
    deleteCookie('radiology_token');
    deleteCookie('radiology_refresh_token');
    try {
      localStorage.removeItem(STORAGE_SESSION);
      localStorage.removeItem(STORAGE_BOOKMARKS_PRIMARY);
      localStorage.removeItem(STORAGE_BOOKMARKS_SECONDARY);
      localStorage.removeItem(STORAGE_DOWNLOADS);
      localStorage.removeItem('radiology_post_comments_v1');
      localStorage.removeItem('radiology_study_streak');
      localStorage.removeItem('radiology_auth_token');
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: null }));
    window.dispatchEvent(new CustomEvent('bookmarks-updated', { detail: { bookmarks: [], count: 0 } }));
    window.dispatchEvent(new CustomEvent('downloads-updated', { detail: { downloads: [], count: 0 } }));
    return true;
  }

  // Toast Notification Helper
  function showToast(message, type = 'info') {
    let toast = document.getElementById('mrg-global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'mrg-global-toast';
      toast.className = 'mrg-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `mrg-toast mrg-toast-${type} is-visible`;

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3200);
  }

  // Expose global API
  window.RadiologyAuth = {
    // Cookie Helpers
    setCookie,
    getCookie,
    deleteCookie,

    // Vault & Accounts Store
    findStoredAccount,
    getStoredAccounts: getVault,
    loginOrRestoreLocalAccount,

    // Bookmark API (Cookie-based)
    getBookmarks,
    saveBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark,

    // Session & Account API
    getSession,
    createLocalAccount,
    setGoogleAccount,
    updateProfile,
    clearSession,
    revokeAllTokens,
    resetAccount,
    deleteAccount,
    isLoggedIn,
    isLocalAccount,
    canComment,

    // UI Helper
    showToast
  };

  // Sync initial bookmarks on boot
  document.addEventListener('DOMContentLoaded', () => {
    getBookmarks();
  });

})();
