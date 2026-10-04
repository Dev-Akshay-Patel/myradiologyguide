/**
 * WORKSPACE CONTROLLER
 * Clinical Radiology Guide - Universal Workspace Controller
 * 
 * Tabs:
 * 1. Bookmarks (Anonymous local + Google cloud synced)
 * 2. Downloads (Anonymous local history + Google cloud synced)
 * 3. Comments (Google authentication required to post/view)
 * 4. Account (Account management, Google sync status, sign out, danger zone)
 */

(function () {
  'use strict';

  const STORAGE_DOWNLOADS_KEY = 'radiology_downloads_history_v1';
  const STORAGE_COMMENTS_KEY = 'radiology_post_comments_v1';

  // Default initial download history for educational demonstration
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorkspace);
  } else {
    initWorkspace();
  }

  function initWorkspace() {
    const signedInView = document.getElementById('account-signed-in-view');
    const loggedOutView = document.getElementById('account-logged-out-view');

    const anonymousHero = document.getElementById('workspace-anonymous-hero');
    const profileHero = document.getElementById('account-profile-hero');
    const avatarImg = document.getElementById('account-avatar-img');
    const nameEl = document.getElementById('account-display-name');
    const emailEl = document.getElementById('account-display-email');
    const typeTagEl = document.getElementById('account-type-tag');
    const providerBadgeEl = document.getElementById('account-provider-badge');
    const memberDateEl = document.getElementById('account-member-date');
    const signoutBtn = document.getElementById('account-signout-btn');
    const heroGoogleBtn = document.getElementById('hero-google-signin-btn');
    const editProfileBtn = document.getElementById('account-edit-profile-btn');
    const streakCard = document.getElementById('account-streak-card');
    const dateCard = document.getElementById('account-date-card') || document.getElementById('account-clock-card');
    const loggingOutOverlay = document.getElementById('logging-out-overlay');

    let isSigningOut = false;

    // Tabs
    const tabBtns = document.querySelectorAll('.account-tab-btn');
    const tabPanes = document.querySelectorAll('.account-tab-pane');

    const bookmarksCountEl = document.getElementById('tab-count-bookmarks');
    const downloadsCountEl = document.getElementById('tab-count-downloads');
    const commentsCountEl = document.getElementById('tab-count-comments');

    const bookmarksListEl = document.getElementById('account-bookmarks-list');
    const downloadsListEl = document.getElementById('account-downloads-list');
    const commentsListEl = document.getElementById('account-comments-list');
    const accountSettingsContainer = document.getElementById('account-settings-content');

    const sidebarAuthVal = document.getElementById('account-sidebar-auth-val');
    const sidebarStatusVal = document.getElementById('account-sidebar-status-val');
    const sidebarLoginVal = document.getElementById('account-sidebar-login-val');
    const sidebarHoursLabel = document.getElementById('account-sidebar-hours-label');
    const sidebarHoursVal = document.getElementById('account-sidebar-hours-val');

    let currentTab = 'bookmarks';

    // Multi-selection states per tab
    const selectMode = {
      bookmarks: false,
      downloads: false,
      comments: false
    };

    const selectedIds = {
      bookmarks: new Set(),
      downloads: new Set(),
      comments: new Set()
    };

    // Ensure initial downloads exist in storage
    try {
      const existingDl = localStorage.getItem(STORAGE_DOWNLOADS_KEY);
      if (!existingDl) {
        localStorage.setItem(STORAGE_DOWNLOADS_KEY, JSON.stringify(DEFAULT_INITIAL_DOWNLOADS));
      }
    } catch (e) {}

    // Initial render
    renderAll();

    // Google Sign in listener on profile hero
    if (heroGoogleBtn) {
      heroGoogleBtn.addEventListener('click', handleGoogleLogin);
    }

    // Sign out listener
    if (signoutBtn) {
      signoutBtn.addEventListener('click', handleSignOut);
    }

    // Edit Profile Modal initialization (if applicable)
    initEditProfileModal();

    // Tab navigation switching
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        if (!targetTab || targetTab === currentTab) return;

        currentTab = targetTab;
        tabBtns.forEach(b => {
          const isActive = b.getAttribute('data-tab') === currentTab;
          b.classList.toggle('is-active', isActive);
          b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        tabPanes.forEach(p => {
          const isActive = p.id === `tab-pane-${currentTab}`;
          p.classList.toggle('is-active', isActive);
        });

        renderTabContent(currentTab, true);
      });
    });

    // Custom event listeners
    window.addEventListener('auth-state-changed', () => {
      renderAll();
    });

    window.addEventListener('bookmarks-updated', () => {
      renderTabContent('bookmarks');
      const bmarks = getBookmarkedPosts();
      updateCounterSafe(bookmarksCountEl, bmarks.length);
    });

    window.addEventListener('downloads-updated', () => {
      renderTabContent('downloads');
      const dls = getDownloads();
      updateCounterSafe(downloadsCountEl, dls.length);
    });

    window.addEventListener('storage', (e) => {
      if (e.key === 'my_radiology_user_session' ||
          e.key === 'radiology_saved_posts' ||
          e.key === 'radiology_saved_protocols' ||
          e.key === STORAGE_COMMENTS_KEY ||
          e.key === STORAGE_DOWNLOADS_KEY) {
        renderAll();
      }
    });

    /* ==========================================================================
       DATA RETRIEVAL & DOM HELPERS
       ========================================================================== */

    function updateCounterSafe(el, count) {
      if (!el) return;
      const str = String(count);
      if (el.textContent !== str) {
        el.textContent = str;
      }
    }

    function isGoogleUser() {
      if (window.RadiologyAuth && typeof window.RadiologyAuth.isGoogleUser === 'function') {
        return window.RadiologyAuth.isGoogleUser();
      }
      const s = getSession();
      return !!(s && (s.provider === 'google' || s.isGoogle));
    }

    function getSession() {
      if (window.RadiologyAuth && typeof window.RadiologyAuth.getSession === 'function') {
        return window.RadiologyAuth.getSession();
      }
      try {
        const raw = localStorage.getItem('my_radiology_user_session');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    }

    function getSavedBookmarkIds() {
      if (window.RadiologyAuth && typeof window.RadiologyAuth.getBookmarks === 'function') {
        return window.RadiologyAuth.getBookmarks();
      }
      let ids = [];
      try {
        const raw1 = localStorage.getItem('radiology_saved_posts');
        const raw2 = localStorage.getItem('radiology_saved_protocols');
        if (raw1) ids = ids.concat(JSON.parse(raw1));
        if (raw2) ids = ids.concat(JSON.parse(raw2));
      } catch (e) {}
      return Array.from(new Set(ids));
    }

    function getBookmarkedPosts() {
      const ids = getSavedBookmarkIds();
      const allPosts = window.POSTS_DATA || [];
      return allPosts.filter(p => ids.includes(p.id) || ids.includes(p.slug));
    }

    function getDownloads() {
      if (window.RadiologyAuth && typeof window.RadiologyAuth.getDownloads === 'function') {
        return window.RadiologyAuth.getDownloads();
      }
      let list = [];
      try {
        const raw = localStorage.getItem(STORAGE_DOWNLOADS_KEY);
        if (raw) list = JSON.parse(raw);
      } catch (e) {}

      if (!list || list.length === 0) {
        list = DEFAULT_INITIAL_DOWNLOADS;
        try {
          localStorage.setItem(STORAGE_DOWNLOADS_KEY, JSON.stringify(list));
        } catch (e) {}
      }
      return list;
    }

    function getComments() {
      if (!isGoogleUser()) {
        return [];
      }
      let list = [];
      try {
        const raw = localStorage.getItem(STORAGE_COMMENTS_KEY);
        if (raw) list = JSON.parse(raw);
      } catch (e) {}

      if (!list || list.length === 0) {
        list = [
          {
            id: 'cmt-user-1',
            text: 'When assessing multi-phase CTA for anterior circulation occlusion, how do you reliably differentiate slow retrograde leptomeningeal washout from true core non-viability?',
            timestamp: Date.now() - 1000 * 60 * 60 * 3,
            postTitle: 'Acute Ischemic Stroke: Multiphase CTA Collateral Atlas',
            postUrl: '/post/index.html'
          }
        ];
        try {
          localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(list));
        } catch (e) {}
      }
      return list;
    }

    const STORAGE_LOCAL_PROFILE_KEY = 'radiology_local_profile';

    const DEFAULT_LOCAL_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cdefs%3E%3ClinearGradient id='bgGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%233b82f6'/%3E%3Cstop offset='100%25' stop-color='%231d4ed8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='120' height='120' rx='16' fill='url(%23bgGrad)'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff' opacity='0.95'/%3E%3Cpath d='M28,102 C28,82 42,74 60,74 C78,74 92,82 92,102' fill='%23ffffff' opacity='0.95'/%3E%3Cpath d='M54,80 L66,80 M60,74 L60,86' stroke='%233b82f6' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E";

    function generateFriendlyAvatar(seed = 'radiology') {
      if (typeof window !== 'undefined' && window.DiceBear && typeof window.DiceBear.getRandomAvatar === 'function') {
        return window.DiceBear.getRandomAvatar(seed);
      }
      return DEFAULT_LOCAL_AVATAR;
    }

    function getLocalProfile() {
      try {
        const raw = localStorage.getItem(STORAGE_LOCAL_PROFILE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.name) return parsed;
        }
      } catch (e) {}

      try {
        const raw = localStorage.getItem('my_radiology_user_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.name && parsed.name !== 'Workspace') {
            return {
              name: parsed.name,
              avatar: parsed.avatar || DEFAULT_LOCAL_AVATAR
            };
          }
        }
      } catch (e) {}

      return {
        name: 'Dr. Alex Morgan',
        avatar: DEFAULT_LOCAL_AVATAR
      };
    }

    function saveLocalProfile(data) {
      try {
        localStorage.setItem(STORAGE_LOCAL_PROFILE_KEY, JSON.stringify(data));
      } catch (e) {}
    }

    function handleGoogleLogin() {
      if (window.RadiologyAuth && typeof window.RadiologyAuth.signInWithGoogle === 'function') {
        window.RadiologyAuth.signInWithGoogle(window.location.href);
      } else {
        window.location.href = '../login/index.html';
      }
    }

    function handleSignOut() {
      if (isSigningOut) return;
      isSigningOut = true;

      if (loggingOutOverlay) {
        loggingOutOverlay.classList.remove('is-hidden');
      }

      setTimeout(() => {
        if (window.RadiologyAuth && typeof window.RadiologyAuth.signOut === 'function') {
          window.RadiologyAuth.signOut();
        } else if (window.RadiologyAuth && typeof window.RadiologyAuth.clearSession === 'function') {
          window.RadiologyAuth.clearSession();
        } else {
          localStorage.removeItem('my_radiology_user_session');
        }
        if (loggingOutOverlay) {
          loggingOutOverlay.classList.add('is-hidden');
        }
        isSigningOut = false;
        renderAll();
      }, 450);
    }

    /* ==========================================================================
       DATE CARD ENGINE (LOCAL ACCOUNT - e.g. 3 Oct)
       ========================================================================== */
    function updateDateCard() {
      const dayEl = document.getElementById('date-day-num');
      const monthEl = document.getElementById('date-month-text');
      const dateDisplay = document.getElementById('account-date-display');
      const now = new Date();
      const day = now.getDate();
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[now.getMonth()];

      if (dayEl) dayEl.textContent = day;
      if (monthEl) monthEl.textContent = month;
      if (dateDisplay && (!dayEl || !monthEl)) dateDisplay.textContent = `${day} ${month}`;
    }

    /* ==========================================================================
       RENDER ALL (Anonymous & Google Aware)
       ========================================================================== */

    function renderAll() {
      if (isSigningOut) return;
      const session = getSession();
      const googleAuth = isGoogleUser();

      // Show signed-in view for both anonymous and google (Workspace is universal!)
      if (signedInView) signedInView.classList.remove('is-hidden');
      if (loggedOutView) loggedOutView.classList.add('is-hidden');

      document.documentElement.setAttribute('data-account-type', googleAuth ? 'google' : 'anonymous');
      if (signedInView) signedInView.setAttribute('data-account-type', googleAuth ? 'google' : 'anonymous');

      if (googleAuth && session) {
        // Authenticated with Google
        // 1. Hide anonymous sync hero, show Google authenticated profile card
        if (anonymousHero) {
          anonymousHero.classList.add('is-hidden');
          anonymousHero.style.display = 'none';
        }
        if (profileHero) {
          profileHero.classList.remove('is-hidden');
          profileHero.style.display = 'flex';
        }

        // 2. Set authenticated profile name & email (no editing allowed)
        if (nameEl) nameEl.textContent = session.name || 'Verified Radiologist';
        if (emailEl) {
          emailEl.textContent = session.email || 'Google Account';
          emailEl.title = session.email || 'Google Account';
          emailEl.classList.remove('is-hidden');
          emailEl.style.display = '';
        }
        if (typeTagEl) {
          typeTagEl.classList.add('is-hidden');
          typeTagEl.style.display = 'none';
        }
        if (providerBadgeEl) {
          providerBadgeEl.classList.remove('is-hidden');
          providerBadgeEl.style.display = '';
          providerBadgeEl.className = 'account-google-badge badge-google';
          providerBadgeEl.title = 'Verified Google SSO';
          providerBadgeEl.innerHTML = `
            <svg viewBox="0 0 24 24" width="13" height="13" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
          `;
        }
        if (avatarImg) {
          avatarImg.onerror = () => {
            avatarImg.src = generateFriendlyAvatar(session.name || 'radiology-user');
          };
          avatarImg.src = session.avatar || generateFriendlyAvatar(session.name || 'radiology-user');
          avatarImg.alt = session.name || 'User avatar';
        }
        if (signoutBtn) {
          signoutBtn.classList.remove('is-hidden');
          signoutBtn.style.display = '';
        }
        // Explicitly: "(dont add editing)"
        if (editProfileBtn) {
          editProfileBtn.classList.add('is-hidden');
          editProfileBtn.style.display = 'none';
        }
        // Hide date card when Google signed in
        if (dateCard) {
          dateCard.classList.add('is-hidden');
          dateCard.style.display = 'none';
        }

        // "add streak for account when google signed in"
        if (streakCard) {
          streakCard.classList.remove('is-hidden');
          streakCard.style.display = 'flex';
        }
      } else {
        // Local Browser State (Anonymous):
        // "remove the profile div only
        // and place a nice Continue with google to sync your Saves download and post comment disply it nicely"
        if (profileHero) {
          profileHero.classList.add('is-hidden');
          profileHero.style.display = 'none';
        }
        if (anonymousHero) {
          anonymousHero.classList.remove('is-hidden');
          anonymousHero.style.display = 'flex';
        }
        // Do not add editing
        if (editProfileBtn) {
          editProfileBtn.classList.add('is-hidden');
          editProfileBtn.style.display = 'none';
        }
        // Remove streak when in local account
        if (streakCard) {
          streakCard.classList.add('is-hidden');
          streakCard.style.display = 'none';
        }

        // Current date card for local account (e.g. 3 Oct)
        if (dateCard) {
          dateCard.classList.remove('is-hidden');
          dateCard.style.display = 'flex';
        }
        updateDateCard();
      }

      if (memberDateEl) {
        memberDateEl.textContent = 'Active Study Session';
      }

      // Update Account Activity in sidebar
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

      if (googleAuth && session) {
        if (sidebarAuthVal) sidebarAuthVal.textContent = 'Google SSO';
        if (sidebarStatusVal) {
          sidebarStatusVal.textContent = 'Active';
          sidebarStatusVal.style.color = '#22c55e';
        }
        if (sidebarLoginVal) {
          sidebarLoginVal.textContent = session.loginTime || ('Today, ' + timeStr);
        }
        if (sidebarHoursLabel) sidebarHoursLabel.textContent = 'Hours active on account';
        if (sidebarHoursVal) sidebarHoursVal.textContent = '14.8 hrs (synced)';
      } else {
        if (sidebarAuthVal) sidebarAuthVal.textContent = 'Local Account';
        if (sidebarStatusVal) {
          sidebarStatusVal.textContent = 'Active';
          sidebarStatusVal.style.color = '#22c55e';
        }
        if (sidebarLoginVal) {
          let localLogin = localStorage.getItem('radiology_local_login_time');
          if (!localLogin) {
            localLogin = 'Today, ' + timeStr;
            try {
              localStorage.setItem('radiology_local_login_time', localLogin);
            } catch (e) {}
          }
          sidebarLoginVal.textContent = localLogin;
        }
        if (sidebarHoursLabel) sidebarHoursLabel.textContent = 'Hours active on account';
        if (sidebarHoursVal) sidebarHoursVal.textContent = '2.4 hrs (local)';
      }

      // Update counters
      const bookmarks = getBookmarkedPosts();
      const downloads = getDownloads();
      const comments = getComments();

      updateCounterSafe(bookmarksCountEl, bookmarks.length);
      updateCounterSafe(downloadsCountEl, downloads.length);
      updateCounterSafe(commentsCountEl, comments.length);

      // Render Active Tab
      renderTabContent(currentTab, false);
    }

    let tabSwitchTimer = null;

    function renderTabContent(tab, showSkeleton = false) {
      if (showSkeleton) {
        if (tabSwitchTimer) clearTimeout(tabSwitchTimer);
        tabSwitchTimer = setTimeout(() => {
          if (tab === 'bookmarks') renderBookmarks();
          else if (tab === 'downloads') renderDownloads();
          else if (tab === 'comments') renderComments();
          else if (tab === 'account') renderAccountTab();
        }, 80);
      } else {
        if (tab === 'bookmarks') renderBookmarks();
        else if (tab === 'downloads') renderDownloads();
        else if (tab === 'comments') renderComments();
        else if (tab === 'account') renderAccountTab();
      }
    }

    /* ==========================================================================
       1. BOOKMARKS TAB RENDERER (Local)
       ========================================================================== */
    function renderBookmarks() {
      if (!bookmarksListEl) return;

      const bookmarks = getBookmarkedPosts();
      updateCounterSafe(bookmarksCountEl, bookmarks.length);

      const isSelecting = selectMode.bookmarks;
      const selected = selectedIds.bookmarks;

      if (bookmarks.length === 0) {
        bookmarksListEl.innerHTML = `
          <div class="account-empty-state">
            <svg class="account-empty-icon" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
            <h4 class="account-empty-title">No saved bookmarks yet</h4>
            <p class="account-empty-desc">When you click "Save" on any clinical protocol across the guide, it immediately saves to your browser and appears here.</p>
            <a href="../index.html" class="account-empty-btn">Browse Clinical Protocols</a>
          </div>
        `;
        return;
      }

      const toolbarHtml = `
        <div class="account-tab-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-count">${bookmarks.length} Saved Protocol${bookmarks.length === 1 ? '' : 's'}</span>
          </div>
          <div class="toolbar-right">
            ${isSelecting ? `
              <button type="button" class="toolbar-action-btn btn-cancel" id="btn-cancel-select-bookmarks">Cancel</button>
              <button type="button" class="toolbar-action-btn btn-select-all" id="btn-select-all-bookmarks">Select All</button>
              <button type="button" class="toolbar-action-btn btn-delete-selected" id="btn-delete-selected-bookmarks" ${selected.size === 0 ? 'disabled' : ''}>
                Delete Selected (${selected.size})
              </button>
            ` : `
              <button type="button" class="toolbar-action-btn" id="btn-enter-select-bookmarks">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                <span>Select to Delete</span>
              </button>
            `}
          </div>
        </div>
      `;

      const itemsHtml = bookmarks.map(b => {
        const isChecked = selected.has(b.id);
        const postLink = b.url || `../post/index.html`;

        return `
          <div class="account-item-card ${isSelecting ? 'has-checkbox' : ''} ${isChecked ? 'is-selected' : ''}" data-item-id="${b.id}">
            ${isSelecting ? `
              <div class="account-item-checkbox-wrap">
                <input type="checkbox" class="account-item-checkbox bookmark-check" data-id="${b.id}" ${isChecked ? 'checked' : ''} aria-label="Select ${escapeHtml(b.title)}" />
              </div>
            ` : ''}
            
            <div class="account-item-thumb-box">
              <img src="${b.thumbnail || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=300&q=80'}" alt="" loading="lazy" />
            </div>

            <div class="account-item-main">
              <div class="account-item-header">
                <span class="account-item-badge">${escapeHtml(b.Topic || 'Protocol')}</span>
                <span class="account-item-meta-dot">•</span>
                <span class="account-item-time">${escapeHtml(b.readTime || '5 min read')}</span>
              </div>
              <h4 class="account-item-title">
                <a href="${postLink}" class="account-item-title-link">${escapeHtml(b.title)}</a>
              </h4>
              <p class="account-item-snippet">${escapeHtml(b.description || '')}</p>
            </div>

            <div class="account-item-actions">
              <a href="${postLink}" class="account-action-primary-btn" title="Open protocol">Open</a>
              <button type="button" class="account-action-delete-btn btn-delete-single-bookmark" data-id="${b.id}" title="Remove bookmark" aria-label="Remove bookmark">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                <span>Delete</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      bookmarksListEl.innerHTML = toolbarHtml + '<div class="account-items-grid">' + itemsHtml + '</div>';

      // Toolbar event listeners
      const enterSelectBtn = document.getElementById('btn-enter-select-bookmarks');
      const cancelSelectBtn = document.getElementById('btn-cancel-select-bookmarks');
      const selectAllBtn = document.getElementById('btn-select-all-bookmarks');
      const deleteSelectedBtn = document.getElementById('btn-delete-selected-bookmarks');

      if (enterSelectBtn) {
        enterSelectBtn.addEventListener('click', () => {
          selectMode.bookmarks = true;
          selectedIds.bookmarks.clear();
          renderBookmarks();
        });
      }

      if (cancelSelectBtn) {
        cancelSelectBtn.addEventListener('click', () => {
          selectMode.bookmarks = false;
          selectedIds.bookmarks.clear();
          renderBookmarks();
        });
      }

      if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
          const allIds = bookmarks.map(b => b.id);
          if (selectedIds.bookmarks.size === allIds.length) {
            selectedIds.bookmarks.clear();
          } else {
            allIds.forEach(id => selectedIds.bookmarks.add(id));
          }
          renderBookmarks();
        });
      }

      if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', () => {
          if (selectedIds.bookmarks.size === 0) return;
          deleteBookmarks(Array.from(selectedIds.bookmarks));
          selectedIds.bookmarks.clear();
          selectMode.bookmarks = false;
          renderBookmarks();
        });
      }

      // Checkbox toggling
      bookmarksListEl.querySelectorAll('.bookmark-check').forEach(cb => {
        cb.addEventListener('change', () => {
          const id = cb.getAttribute('data-id');
          if (cb.checked) selectedIds.bookmarks.add(id);
          else selectedIds.bookmarks.delete(id);
          renderBookmarks();
        });
      });

      // Single Delete
      bookmarksListEl.querySelectorAll('.btn-delete-single-bookmark').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const id = btn.getAttribute('data-id');
          if (id) {
            deleteBookmarks([id]);
            renderBookmarks();
          }
        });
      });
    }



    function deleteBookmarks(idsToDelete) {
      if (window.RadiologyAuth && typeof window.RadiologyAuth.removeBookmark === 'function') {
        idsToDelete.forEach(id => window.RadiologyAuth.removeBookmark(id));
        if (window.RadiologyAuth.showToast) {
          window.RadiologyAuth.showToast(`Removed ${idsToDelete.length} bookmark${idsToDelete.length === 1 ? '' : 's'}`, 'info');
        }
      } else {
        try {
          let list1 = JSON.parse(localStorage.getItem('radiology_saved_posts') || '[]');
          list1 = list1.filter(id => !idsToDelete.includes(id));
          localStorage.setItem('radiology_saved_posts', JSON.stringify(list1));
        } catch (e) {}
      }

      const updated = getBookmarkedPosts();
      updateCounterSafe(bookmarksCountEl, updated.length);
    }

    /* ==========================================================================
       2. DOWNLOADS TAB RENDERER (Local + Merged)
       ========================================================================== */
    function renderDownloads() {
      if (!downloadsListEl) return;

      const downloads = getDownloads();
      updateCounterSafe(downloadsCountEl, downloads.length);

      const isSelecting = selectMode.downloads;
      const selected = selectedIds.downloads;

      if (downloads.length === 0) {
        downloadsListEl.innerHTML = `
          <div class="account-empty-state">
            <svg class="account-empty-icon" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <h4 class="account-empty-title">No download history</h4>
            <p class="account-empty-desc">Materials and pocket references you download from the Books section are automatically tracked here.</p>
            <a href="/books/" class="account-empty-btn">Explore Reference Library</a>
          </div>
        `;
        return;
      }

      const toolbarHtml = `
        <div class="account-tab-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-count">${downloads.length} Downloaded File${downloads.length === 1 ? '' : 's'}</span>
          </div>
          <div class="toolbar-right">
            ${isSelecting ? `
              <button type="button" class="toolbar-action-btn btn-cancel" id="btn-cancel-select-downloads">Cancel</button>
              <button type="button" class="toolbar-action-btn btn-select-all" id="btn-select-all-downloads">Select All</button>
              <button type="button" class="toolbar-action-btn btn-delete-selected" id="btn-delete-selected-downloads" ${selected.size === 0 ? 'disabled' : ''}>
                Delete Selected (${selected.size})
              </button>
            ` : `
              <button type="button" class="toolbar-action-btn" id="btn-enter-select-downloads">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                <span>Select to Delete</span>
              </button>
            `}
          </div>
        </div>
      `;

      const itemsHtml = downloads.map(d => {
        const isChecked = selected.has(d.id);
        const dateStr = d.timestamp ? new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';

        return `
          <div class="account-download-card ${isSelecting ? 'has-checkbox' : ''} ${isChecked ? 'is-selected' : ''}" data-download-id="${d.id}">
            ${isSelecting ? `
              <div class="account-item-checkbox-wrap">
                <input type="checkbox" class="account-item-checkbox download-check" data-id="${d.id}" ${isChecked ? 'checked' : ''} aria-label="Select download" />
              </div>
            ` : ''}

            <div class="download-format-badge format-${(d.format || 'pdf').toLowerCase()}">
              ${escapeHtml(d.format || 'PDF')}
            </div>

            <div class="download-card-main">
              <div class="download-card-header">
                <span class="download-card-category">${escapeHtml(d.category || 'Literature')}</span>
                <span class="download-card-dot">•</span>
                <span class="download-card-size">${escapeHtml(d.size || '12 MB')}</span>
                <span class="download-card-dot">•</span>
                <span class="download-card-date">Downloaded ${dateStr}</span>
              </div>
              <h4 class="download-card-title">${escapeHtml(d.title)}</h4>
            </div>

            <div class="account-item-actions">
              <a href="${d.url || '/books/'}" class="account-action-primary-btn" title="Download Again">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Download</span>
              </a>
              <button type="button" class="account-action-delete-btn btn-delete-single-download" data-id="${d.id}" title="Delete from history" aria-label="Delete download from history">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                <span>Delete</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      downloadsListEl.innerHTML = toolbarHtml + '<div class="account-downloads-stack">' + itemsHtml + '</div>';

      // Toolbar event listeners
      const enterSelectBtn = document.getElementById('btn-enter-select-downloads');
      const cancelSelectBtn = document.getElementById('btn-cancel-select-downloads');
      const selectAllBtn = document.getElementById('btn-select-all-downloads');
      const deleteSelectedBtn = document.getElementById('btn-delete-selected-downloads');

      if (enterSelectBtn) {
        enterSelectBtn.addEventListener('click', () => {
          selectMode.downloads = true;
          selectedIds.downloads.clear();
          renderDownloads();
        });
      }

      if (cancelSelectBtn) {
        cancelSelectBtn.addEventListener('click', () => {
          selectMode.downloads = false;
          selectedIds.downloads.clear();
          renderDownloads();
        });
      }

      if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
          const allIds = downloads.map(d => d.id);
          if (selectedIds.downloads.size === allIds.length) {
            selectedIds.downloads.clear();
          } else {
            allIds.forEach(id => selectedIds.downloads.add(id));
          }
          renderDownloads();
        });
      }

      if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', () => {
          if (selectedIds.downloads.size === 0) return;
          deleteDownloads(Array.from(selectedIds.downloads));
          selectedIds.downloads.clear();
          selectMode.downloads = false;
          renderDownloads();
        });
      }

      // Checkbox toggling
      downloadsListEl.querySelectorAll('.download-check').forEach(cb => {
        cb.addEventListener('change', () => {
          const id = cb.getAttribute('data-id');
          if (cb.checked) selectedIds.downloads.add(id);
          else selectedIds.downloads.delete(id);
          renderDownloads();
        });
      });

      // Single Delete
      downloadsListEl.querySelectorAll('.btn-delete-single-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const id = btn.getAttribute('data-id');
          if (id) {
            deleteDownloads([id]);
            renderDownloads();
          }
        });
      });
    }

    function deleteDownloads(idsToDelete) {
      if (window.RadiologyAuth && typeof window.RadiologyAuth.removeDownload === 'function') {
        idsToDelete.forEach(id => window.RadiologyAuth.removeDownload(id));
      } else {
        try {
          let list = JSON.parse(localStorage.getItem(STORAGE_DOWNLOADS_KEY) || '[]');
          list = list.filter(d => !idsToDelete.includes(d.id));
          localStorage.setItem(STORAGE_DOWNLOADS_KEY, JSON.stringify(list));
        } catch (e) {}
      }

      const updated = getDownloads();
      updateCounterSafe(downloadsCountEl, updated.length);
    }

    /* ==========================================================================
       3. COMMENTS TAB RENDERER (Authentication Required)
       ========================================================================== */
    function renderComments() {
      if (!commentsListEl) return;

      const googleAuth = isGoogleUser();

      // Rule: Anonymous users must NOT be allowed to submit or manage comments. Show explicit message.
      if (!googleAuth) {
        commentsListEl.innerHTML = `
          <div class="account-empty-state local-restricted-state">
            <div class="restricted-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h4 class="account-empty-title">Sign in with Google to comment</h4>
            <p class="account-empty-desc">
              Public clinical discussions require a verified identity to maintain peer-reviewed diagnostic standards. Sign in with Google to join case threads and post inquiries.
            </p>
          </div>
        `;
        updateCounterSafe(commentsCountEl, 0);
        return;
      }

      // If Google user: render existing comments
      const comments = getComments();
      updateCounterSafe(commentsCountEl, comments.length);

      const isSelecting = selectMode.comments;
      const selected = selectedIds.comments;

      if (comments.length === 0) {
        commentsListEl.innerHTML = `
          <div class="account-empty-state">
            <svg class="account-empty-icon" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h4 class="account-empty-title">No comments posted yet</h4>
            <p class="account-empty-desc">Participate in clinical discussion threads, ask diagnostic questions, and share positioning pearls.</p>
            <a href="../post/index.html" class="account-empty-btn">Explore Discussion Stream</a>
          </div>
        `;
        return;
      }

      const toolbarHtml = `
        <div class="account-tab-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-count">${comments.length} Clinical Discussion Entry${comments.length === 1 ? '' : 'ies'}</span>
          </div>
          <div class="toolbar-right">
            ${isSelecting ? `
              <button type="button" class="toolbar-action-btn btn-cancel" id="btn-cancel-select-comments">Cancel</button>
              <button type="button" class="toolbar-action-btn btn-select-all" id="btn-select-all-comments">Select All</button>
              <button type="button" class="toolbar-action-btn btn-delete-selected" id="btn-delete-selected-comments" ${selected.size === 0 ? 'disabled' : ''}>
                Delete Selected (${selected.size})
              </button>
            ` : `
              <button type="button" class="toolbar-action-btn" id="btn-enter-select-comments">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                <span>Select to Delete</span>
              </button>
            `}
          </div>
        </div>
      `;

      const itemsHtml = comments.map(c => {
        const isChecked = selected.has(c.id);
        const timeAgo = formatTimeAgo(c.timestamp);

        return `
          <div class="account-comment-card ${isSelecting ? 'has-checkbox' : ''} ${isChecked ? 'is-selected' : ''}" data-comment-id="${c.id}">
            ${isSelecting ? `
              <div class="account-item-checkbox-wrap">
                <input type="checkbox" class="account-item-checkbox comment-check" data-id="${c.id}" ${isChecked ? 'checked' : ''} aria-label="Select comment" />
              </div>
            ` : ''}

            <div class="comment-card-main">
              <div class="comment-card-topbar">
                <span class="comment-card-time">${timeAgo}</span>
                <span class="comment-card-dot">•</span>
                <a href="${c.postUrl || '/post/index.html'}" class="comment-card-target-link">${escapeHtml(c.postTitle || 'Acute Ischemic Stroke Protocol')}</a>
              </div>
              <p class="comment-card-body">${escapeHtml(c.text)}</p>
            </div>

            <div class="account-item-actions">
              <a href="${c.postUrl || '/post/index.html'}" class="account-action-primary-btn" title="View thread">View</a>
              <button type="button" class="account-action-delete-btn btn-delete-single-comment" data-id="${c.id}" title="Delete comment" aria-label="Delete comment">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                <span>Delete</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      commentsListEl.innerHTML = toolbarHtml + '<div class="account-comments-stack">' + itemsHtml + '</div>';

      // Toolbar event listeners
      const enterSelectBtn = document.getElementById('btn-enter-select-comments');
      const cancelSelectBtn = document.getElementById('btn-cancel-select-comments');
      const selectAllBtn = document.getElementById('btn-select-all-comments');
      const deleteSelectedBtn = document.getElementById('btn-delete-selected-comments');

      if (enterSelectBtn) {
        enterSelectBtn.addEventListener('click', () => {
          selectMode.comments = true;
          selectedIds.comments.clear();
          renderComments();
        });
      }

      if (cancelSelectBtn) {
        cancelSelectBtn.addEventListener('click', () => {
          selectMode.comments = false;
          selectedIds.comments.clear();
          renderComments();
        });
      }

      if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
          const allIds = comments.map(c => c.id);
          if (selectedIds.comments.size === allIds.length) {
            selectedIds.comments.clear();
          } else {
            allIds.forEach(id => selectedIds.comments.add(id));
          }
          renderComments();
        });
      }

      if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', () => {
          if (selectedIds.comments.size === 0) return;
          deleteComments(Array.from(selectedIds.comments));
          selectedIds.comments.clear();
          selectMode.comments = false;
          renderComments();
        });
      }

      // Checkbox toggling
      commentsListEl.querySelectorAll('.comment-check').forEach(cb => {
        cb.addEventListener('change', () => {
          const id = cb.getAttribute('data-id');
          if (cb.checked) selectedIds.comments.add(id);
          else selectedIds.comments.delete(id);
          renderComments();
        });
      });

      // Single Delete
      commentsListEl.querySelectorAll('.btn-delete-single-comment').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const id = btn.getAttribute('data-id');
          if (id) {
            deleteComments([id]);
            renderComments();
          }
        });
      });
    }

    function deleteComments(idsToDelete) {
      try {
        let list = JSON.parse(localStorage.getItem(STORAGE_COMMENTS_KEY) || '[]');
        list = list.filter(c => !idsToDelete.includes(c.id));
        localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(list));
      } catch (e) {}

      const updated = getComments();
      updateCounterSafe(commentsCountEl, updated.length);
    }

    /* ==========================================================================
       4. ACCOUNT TAB RENDERER (Anonymous vs Google identity)
       ========================================================================== */
    function renderAccountTab() {
      if (!accountSettingsContainer) return;

      const googleAuth = isGoogleUser();
      const session = getSession();

      const tickSvg = `
        <svg class="acc-feature-icon-tick" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#22c55e" aria-label="Available">
          <g clip-path="url(#clip0_4418_8594)">
            <path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z" fill="#22c55e"/>
          </g>
          <defs>
            <clipPath id="clip0_4418_8594">
              <rect width="24" height="24" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      `;

      const crossSvg = `
        <svg class="acc-feature-icon-cross" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-label="Not available">
          <g clip-path="url(#clip0_4418_9821)">
            <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M9.17004 14.8299L14.83 9.16992" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M14.83 14.8299L9.17004 9.16992" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </g>
          <defs>
            <clipPath id="clip0_4418_9821">
              <rect width="24" height="24" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      `;

      if (!googleAuth) {
        // Anonymous User UI: Comparison Table for PC, Cards for Mobile
        accountSettingsContainer.innerHTML = `
          <div class="workspace-anon-account-card">
            <div class="workspace-account-header">
              <h3 class="workspace-section-headline">Account Capabilities</h3>
              <p class="workspace-anon-subhead">You are currently using this browser with local storage. Compare capabilities below.</p>
            </div>

            <!-- 1. Minimal Comparison Table for PC -->
            <div class="acc-compare-table-wrap">
              <table class="acc-compare-table">
                <thead>
                  <tr>
                    <th class="acc-col-feature">Features</th>
                    <th class="acc-col-account">
                      <span class="acc-th-name">Local Account</span>
                    </th>
                    <th class="acc-col-account">
                      <span class="acc-th-name">Google Account</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="acc-cell-feature">
                      <div class="acc-feature-name">Save Bookmarks</div>
                      <div class="acc-feature-desc">Bookmark clinical protocols and diagnostic atlases</div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${tickSvg}
                        <span class="acc-status-text">Saved on this device</span>
                      </div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${tickSvg}
                        <span class="acc-status-text">Synced to cloud</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="acc-cell-feature">
                      <div class="acc-feature-name">Downloads</div>
                      <div class="acc-feature-desc">Track downloaded guidelines, slides, and cheat sheets</div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${tickSvg}
                        <span class="acc-status-text">Saved on this device</span>
                      </div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${tickSvg}
                        <span class="acc-status-text">Synced to cloud</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="acc-cell-feature">
                      <div class="acc-feature-name">See Comments</div>
                      <div class="acc-feature-desc">Browse clinical comments and case discussions</div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${tickSvg}
                        <span class="acc-status-text">Full reading access</span>
                      </div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${tickSvg}
                        <span class="acc-status-text">Full reading access</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="acc-cell-feature">
                      <div class="acc-feature-name">Post Comments</div>
                      <div class="acc-feature-desc">Ask questions and share differential insights</div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${crossSvg}
                        <span class="acc-status-text acc-text-dim">Requires sign-in</span>
                      </div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${tickSvg}
                        <span class="acc-status-text">Full posting access</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="acc-cell-feature">
                      <div class="acc-feature-name">Cross-Device Sync</div>
                      <div class="acc-feature-desc">Access your workspace across phone, tablet, and PC</div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${crossSvg}
                        <span class="acc-status-text acc-text-dim">This browser only</span>
                      </div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${tickSvg}
                        <span class="acc-status-text">All devices synced</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 2. Clean Unconfined Mobile View (Local & Google Capabilities) -->
            <div class="acc-compare-mobile-view">
              
              <!-- Local Account Block -->
              <div class="acc-mobile-block">
                <div class="acc-mobile-heading">Local Account</div>

                <div class="acc-mobile-subgroup">
                  <div class="acc-mobile-sublabel acc-label-adv">What you can do</div>
                  <ul class="acc-mobile-list">
                    <li>
                      ${tickSvg}
                      <span>Save bookmarks locally</span>
                    </li>
                    <li>
                      ${tickSvg}
                      <span>Track download history</span>
                    </li>
                    <li>
                      ${tickSvg}
                      <span>See public comments & discussions</span>
                    </li>
                  </ul>
                </div>

                <div class="acc-mobile-subgroup">
                  <div class="acc-mobile-sublabel acc-label-dis">What you can't do</div>
                  <ul class="acc-mobile-list">
                    <li>
                      ${crossSvg}
                      <span>Post comments & questions</span>
                    </li>
                    <li>
                      ${crossSvg}
                      <span>Sync across multiple devices</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="acc-mobile-divider"></div>

              <!-- Google Account Block -->
              <div class="acc-mobile-block">
                <div class="acc-mobile-heading">Google Account</div>

                <div class="acc-mobile-subgroup">
                  <div class="acc-mobile-sublabel acc-label-adv">What you can do</div>
                  <ul class="acc-mobile-list">
                    <li>
                      ${tickSvg}
                      <span>Save bookmarks with cloud sync</span>
                    </li>
                    <li>
                      ${tickSvg}
                      <span>Downloads synced across all devices</span>
                    </li>
                    <li>
                      ${tickSvg}
                      <span>See & post comments to community</span>
                    </li>
                    <li>
                      ${tickSvg}
                      <span>Automatic cross-device backup</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>

          </div>
        `;
      } else {
        // Google User UI (Clean Danger Zone + Google Capabilities Table below)
        accountSettingsContainer.innerHTML = `
          <div class="workspace-google-account-card">
            <h3 class="workspace-section-headline">Account Settings</h3>

            <!-- Danger Zone -->
            <div class="account-settings-card account-danger-card" id="account-danger-card">
              <div class="account-danger-header">
                <div class="account-danger-header-inner">
                  <svg class="danger-header-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <g clip-path="url(#clip0_4418_9824)">
                      <path d="M12 9V14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M12.0001 21.4093H5.94005C2.47005 21.4093 1.02005 18.9293 2.70005 15.8993L5.82006 10.2793L8.76006 4.9993C10.5401 1.7893 13.4601 1.7893 15.2401 4.9993L18.1801 10.2893L21.3001 15.9093C22.9801 18.9393 21.5201 21.4193 18.0601 21.4193H12.0001V21.4093Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M11.9945 17H12.0035" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </g>
                    <defs>
                      <clipPath id="clip0_4418_9824">
                        <rect width="24" height="24" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>
                  <h3 class="account-danger-title">DANGER ZONE</h3>
                </div>
              </div>

              <div class="danger-items-list">
                <!-- Danger Action 1: Reset Account -->
                <div class="account-settings-action-block danger-item-block">
                  <div class="account-action-meta">
                    <h4 class="account-action-name danger-name-alert">Reset account</h4>
                    <p class="account-action-desc">Resets your saved bookmarks, download history, and progress while keeping your Google sign-in.</p>
                  </div>
                  <div class="account-action-btn-wrap">
                    <button type="button" class="account-btn-action account-btn-reset-danger" id="btn-reset-account">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9.11008 5.08039C9.98008 4.82039 10.9401 4.65039 12.0001 4.65039C16.7901 4.65039 20.6701 8.53039 20.6701 13.3204C20.6701 18.1104 16.7901 21.9904 12.0001 21.9904C7.21008 21.9904 3.33008 18.1104 3.33008 13.3204C3.33008 11.5404 3.87008 9.88039 4.79008 8.50039" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M7.87012 5.32L10.7601 2" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M7.87012 5.32031L11.2401 7.78031" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <span>Reset account</span>
                    </button>
                  </div>
                </div>

                <!-- Danger Action 2: Delete Google Account -->
                <div class="account-settings-action-block danger-item-block">
                  <div class="account-action-meta">
                    <h4 class="account-action-name danger-name-alert">Delete Google account</h4>
                    <p class="account-action-desc">Permanently deletes your cloud synced account and disconnects Google identity.</p>
                  </div>
                  <div class="account-action-btn-wrap">
                    <button type="button" class="account-btn-action account-btn-delete-danger" id="btn-delete-account">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <g clip-path="url(#clip0_4418_9808)">
                          <path d="M21 5.98047C17.67 5.65047 14.32 5.48047 10.98 5.48047C9 5.48047 7.02 5.58047 5.04 5.78047L3 5.98047" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                          <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                          <path d="M18.85 9.14062L18.2 19.2106C18.09 20.7806 18 22.0006 15.21 22.0006H8.79002C6.00002 22.0006 5.91002 20.7806 5.80002 19.2106L5.15002 9.14062" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                          <path d="M10.33 16.5H13.66" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                          <path d="M9.5 12.5H14.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </g>
                        <defs>
                          <clipPath id="clip0_4418_9808">
                            <rect width="24" height="24" fill="white"/>
                          </clipPath>
                        </defs>
                      </svg>
                      <span>Delete Google account</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="workspace-divider"></div>

            <!-- Capabilities Table Just Below Danger Zone (Google Only) -->
            <div class="workspace-account-header">
              <h4 class="workspace-section-headline" style="font-size: 16px;">Active Account Capabilities</h4>
              <p class="workspace-anon-subhead">All features and cross-device sync are enabled on this account.</p>
            </div>

            <!-- 1. Minimal Table for PC (Google Only) -->
            <div class="acc-compare-table-wrap">
              <table class="acc-compare-table">
                <thead>
                  <tr>
                    <th class="acc-col-feature">Features</th>
                    <th class="acc-col-account">
                      <span class="acc-th-name">Google Account</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="acc-cell-feature">
                      <div class="acc-feature-name">Save Bookmarks</div>
                      <div class="acc-feature-desc">Bookmark clinical protocols and diagnostic atlases</div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${tickSvg}
                        <span class="acc-status-text">Synced to cloud</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="acc-cell-feature">
                      <div class="acc-feature-name">Downloads</div>
                      <div class="acc-feature-desc">Track downloaded guidelines, slides, and cheat sheets</div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${tickSvg}
                        <span class="acc-status-text">Synced to cloud</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="acc-cell-feature">
                      <div class="acc-feature-name">See Comments</div>
                      <div class="acc-feature-desc">Browse clinical comments and case discussions</div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${tickSvg}
                        <span class="acc-status-text">Full reading access</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="acc-cell-feature">
                      <div class="acc-feature-name">Post Comments</div>
                      <div class="acc-feature-desc">Ask questions and share differential insights</div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${tickSvg}
                        <span class="acc-status-text">Full posting access</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="acc-cell-feature">
                      <div class="acc-feature-name">Cross-Device Sync</div>
                      <div class="acc-feature-desc">Access your workspace across phone, tablet, and PC</div>
                    </td>
                    <td class="acc-cell-status">
                      <div class="acc-cell-content">
                        ${tickSvg}
                        <span class="acc-status-text">All devices synced</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 2. Clean Unconfined Mobile View (Google Only) -->
            <div class="acc-compare-mobile-view">
              <div class="acc-mobile-block">
                <div class="acc-mobile-subgroup">
                  <div class="acc-mobile-sublabel acc-label-adv">What you can do</div>
                  <ul class="acc-mobile-list">
                    <li>
                      ${tickSvg}
                      <span>Save bookmarks with cloud sync</span>
                    </li>
                    <li>
                      ${tickSvg}
                      <span>Downloads synced across all devices</span>
                    </li>
                    <li>
                      ${tickSvg}
                      <span>See & post comments to community</span>
                    </li>
                    <li>
                      ${tickSvg}
                      <span>Automatic cross-device backup</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        `;

        // Attach danger zone button listeners
        initDangerModals();
      }
    }

    function initDangerModals() {
      const resetBtn = document.getElementById('btn-reset-account');
      const resetOverlay = document.getElementById('modal-reset-account-overlay');
      const resetModal = resetOverlay ? resetOverlay.querySelector('.edit-profile-modal') : null;
      const resetCloseBtn = document.getElementById('modal-reset-close-btn');
      const resetConfirmBtn = document.getElementById('modal-reset-confirm-btn');

      const deleteBtn = document.getElementById('btn-delete-account');
      const deleteOverlay = document.getElementById('modal-delete-account-overlay');
      const deleteModal = deleteOverlay ? deleteOverlay.querySelector('.edit-profile-modal') : null;
      const deleteCloseBtn = document.getElementById('modal-delete-close-btn');
      const deleteConfirmBtn = document.getElementById('modal-delete-confirm-btn');

      const streakNumEl = document.getElementById('streak-count-num');

      function closeAllModals() {
        if (resetOverlay) {
          resetOverlay.classList.remove('is-active');
          if (resetModal) {
            resetModal.style.transform = '';
            resetModal.style.transition = '';
          }
        }
        if (deleteOverlay) {
          deleteOverlay.classList.remove('is-active');
          if (deleteModal) {
            deleteModal.style.transform = '';
            deleteModal.style.transition = '';
          }
        }
        document.body.classList.remove('modal-open');
      }

      function openResetModal() {
        if (!resetOverlay) return;
        if (resetModal) {
          resetModal.style.transform = '';
          resetModal.style.transition = '';
        }
        resetOverlay.classList.add('is-active');
        document.body.classList.add('modal-open');
      }

      function openDeleteModal() {
        if (!deleteOverlay) return;
        if (deleteModal) {
          deleteModal.style.transform = '';
          deleteModal.style.transition = '';
        }
        deleteOverlay.classList.add('is-active');
        document.body.classList.add('modal-open');
      }

      // --- RESET ACCOUNT ---
      if (resetBtn && resetOverlay) {
        resetBtn.addEventListener('click', openResetModal);
        if (resetCloseBtn) resetCloseBtn.addEventListener('click', closeAllModals);
        resetOverlay.addEventListener('click', (e) => {
          if (e.target === resetOverlay) closeAllModals();
        });

        if (resetConfirmBtn) {
          resetConfirmBtn.onclick = () => {
            closeAllModals();
            if (window.RadiologyAuth && typeof window.RadiologyAuth.resetAccount === 'function') {
              window.RadiologyAuth.resetAccount();
            } else {
              try {
                localStorage.setItem(STORAGE_DOWNLOADS_KEY, JSON.stringify([]));
                localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify([]));
              } catch (e) {}
            }
            if (streakNumEl) streakNumEl.textContent = '0';
            if (window.RadiologyAuth && typeof window.RadiologyAuth.showToast === 'function') {
              window.RadiologyAuth.showToast('Workspace data reset successfully.', 'info');
            }
            renderAll();
          };
        }
      }

      // --- DELETE ACCOUNT ---
      if (deleteBtn && deleteOverlay) {
        deleteBtn.addEventListener('click', openDeleteModal);
        if (deleteCloseBtn) deleteCloseBtn.addEventListener('click', closeAllModals);
        deleteOverlay.addEventListener('click', (e) => {
          if (e.target === deleteOverlay) closeAllModals();
        });

        if (deleteConfirmBtn) {
          deleteConfirmBtn.onclick = () => {
            closeAllModals();
            if (loggingOutOverlay) {
              const textEl = loggingOutOverlay.querySelector('.logging-out-text');
              if (textEl) textEl.textContent = 'Deleting Google account data...';
              loggingOutOverlay.classList.remove('is-hidden');
            }
            setTimeout(() => {
              if (window.RadiologyAuth && typeof window.RadiologyAuth.deleteGoogleAccount === 'function') {
                window.RadiologyAuth.deleteGoogleAccount();
              } else if (window.RadiologyAuth && typeof window.RadiologyAuth.deleteAccount === 'function') {
                window.RadiologyAuth.deleteAccount();
              } else {
                localStorage.removeItem('my_radiology_user_session');
              }
              if (loggingOutOverlay) {
                loggingOutOverlay.classList.add('is-hidden');
              }
              renderAll();
            }, 600);
          };
        }
      }

      // Attach mobile swipe dismiss handlers
      attachSheetDismiss(resetModal, closeAllModals);
      attachSheetDismiss(deleteModal, closeAllModals);
    }

    function attachSheetDismiss(modal, onClose) {
      if (!modal) return;
      let touchStartY = 0;
      let touchCurrentY = 0;
      let isDragging = false;
      let rafId = null;

      modal.addEventListener('touchstart', (e) => {
        if (window.innerWidth >= 640) return;
        touchStartY = e.touches[0].clientY;
        touchCurrentY = touchStartY;
        isDragging = true;
      }, { passive: true });

      modal.addEventListener('touchmove', (e) => {
        if (!isDragging || window.innerWidth >= 640) return;
        touchCurrentY = e.touches[0].clientY;
        const deltaY = touchCurrentY - touchStartY;
        if (deltaY > 0) {
          if (!rafId) {
            rafId = requestAnimationFrame(() => {
              modal.style.transition = 'none';
              modal.style.transform = `translate3d(0, ${deltaY}px, 0)`;
              rafId = null;
            });
          }
        }
      }, { passive: true });

      modal.addEventListener('touchend', () => {
        if (!isDragging || window.innerWidth >= 640) return;
        isDragging = false;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        const deltaY = touchCurrentY - touchStartY;
        modal.style.transition = '';
        if (deltaY > 50) {
          onClose();
        } else {
          modal.style.transform = '';
        }
      });
    }

    /* ==========================================================================
       5. EDIT PROFILE MODAL (Optional fallback)
       ========================================================================== */
    function initEditProfileModal() {
      const overlay = document.getElementById('edit-profile-overlay');
      const modal = document.getElementById('edit-profile-modal');
      const closeBtn = document.getElementById('edit-profile-close-btn');
      const form = document.getElementById('edit-profile-form');
      const nameInput = document.getElementById('edit-modal-name-input');
      const avatarPreview = document.getElementById('edit-modal-avatar-preview');
      const randomBtn = document.getElementById('edit-btn-random-avatar');
      const uploadInput = document.getElementById('edit-modal-file-upload');

      if (!overlay || !modal) return;

      let tempAvatar = '';

      function openModal() {
        const prof = getLocalProfile();
        if (nameInput) {
          nameInput.value = prof.name || 'Dr. Alex Morgan';
          if (nameInput.value) {
            nameInput.classList.add('has-value');
          } else {
            nameInput.classList.remove('has-value');
          }
        }
        tempAvatar = prof.avatar || DEFAULT_LOCAL_AVATAR;
        if (avatarPreview) {
          avatarPreview.src = tempAvatar;
        }
        overlay.classList.add('is-active');
        document.body.classList.add('modal-open');
        setTimeout(() => {
          if (nameInput) nameInput.focus();
        }, 120);
      }

      function closeModal() {
        modal.style.transform = '';
        modal.style.transition = '';
        overlay.classList.remove('is-active');
        document.body.classList.remove('modal-open');
      }

      if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openModal);
      }

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });

      attachSheetDismiss(modal, closeModal);

      // Randomize friendly avatar
      if (randomBtn) {
        randomBtn.addEventListener('click', () => {
          const seeds = ['physician', 'clinician', 'specialist', 'radiologist', 'resident', 'fellow'];
          const randSeed = 'rad-' + seeds[Math.floor(Math.random() * seeds.length)] + '-' + Math.floor(Math.random() * 10000);
          tempAvatar = generateFriendlyAvatar(randSeed);
          if (avatarPreview) {
            avatarPreview.src = tempAvatar;
          }
        });
      }

      // Upload Custom Photo
      if (uploadInput) {
        uploadInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            if (file.size > 4 * 1024 * 1024) {
              if (window.RadiologyAuth && typeof window.RadiologyAuth.showToast === 'function') {
                window.RadiologyAuth.showToast('Please choose an image under 4MB', 'warning');
              }
              return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
              tempAvatar = ev.target.result;
              if (avatarPreview) {
                avatarPreview.src = tempAvatar;
              }
            };
            reader.readAsDataURL(file);
          }
        });
      }

      // Material Design floating label sync
      if (nameInput) {
        nameInput.addEventListener('input', () => {
          if (nameInput.value.trim().length > 0) {
            nameInput.classList.add('has-value');
          } else {
            nameInput.classList.remove('has-value');
          }
        });
      }

      // Save form
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const newName = nameInput ? nameInput.value.trim() : '';
          if (!newName) {
            if (nameInput) nameInput.focus();
            return;
          }

          saveLocalProfile({
            name: newName,
            avatar: tempAvatar || DEFAULT_LOCAL_AVATAR
          });

          renderAll();
          closeModal();

          if (window.RadiologyAuth && typeof window.RadiologyAuth.showToast === 'function') {
            window.RadiologyAuth.showToast('Profile updated', 'success');
          }
        });
      }

      // Escape listener
      document.addEventListener('keydown', (e) => {
        if (e && e.key === 'Escape') {
          closeModal();
          const rOverlay = document.getElementById('modal-reset-account-overlay');
          const dOverlay = document.getElementById('modal-delete-account-overlay');
          if (rOverlay) rOverlay.classList.remove('is-active');
          if (dOverlay) dOverlay.classList.remove('is-active');
          document.body.classList.remove('modal-open');
        }
      });
    }

    /* ==========================================================================
       UTILITIES
       ========================================================================== */
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function formatTimeAgo(ts) {
      if (!ts) return 'recently';
      const now = Date.now();
      const diffSec = Math.floor((now - Number(ts)) / 1000);
      if (diffSec < 60) return 'just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'yesterday';
      if (diffDays < 30) return `${diffDays}d ago`;
      return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
})();
