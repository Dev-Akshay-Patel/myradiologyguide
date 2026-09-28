/**
 * ACCOUNT JS
 * Universal Dashboard Controller supporting:
 * - Cookie-Based Local Accounts (Private, offline, customizable profile)
 * - Google Accounts (Discussion commenting & Cloud sync)
 * - Cookie-based Bookmark Management
 * - Download history tracking
 * - Comment restrictions for Local Accounts
 */

(function () {
  'use strict';

  const STORAGE_DOWNLOADS_KEY = 'radiology_downloads_history_v1';
  const STORAGE_COMMENTS_KEY = 'radiology_post_comments_v1';



  // Seed initial downloads if none exist yet
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

  document.addEventListener('DOMContentLoaded', () => {
    initAccount();
  });

  function initAccount() {
    const signedInView = document.getElementById('account-signed-in-view');
    const loggedOutView = document.getElementById('account-logged-out-view');

    const avatarImg = document.getElementById('account-avatar-img');
    const nameEl = document.getElementById('account-display-name');
    const emailEl = document.getElementById('account-display-email');
    const typeTagEl = document.getElementById('account-type-tag');
    const providerBadgeEl = document.getElementById('account-provider-badge');
    const memberDateEl = document.getElementById('account-member-date');
    const signoutBtn = document.getElementById('account-signout-btn');
    const editProfileBtn = document.getElementById('account-edit-profile-btn');
    const loggingOutOverlay = document.getElementById('logging-out-overlay');

    let isSigningOut = false;

    // Tab buttons & panes
    const tabBtns = document.querySelectorAll('.account-tab-btn');
    const tabPanes = document.querySelectorAll('.account-tab-pane');

    const bookmarksCountEl = document.getElementById('tab-count-bookmarks');
    const commentsCountEl = document.getElementById('tab-count-comments');
    const downloadsCountEl = document.getElementById('tab-count-downloads');

    const bookmarksListEl = document.getElementById('account-bookmarks-list');
    const commentsListEl = document.getElementById('account-comments-list');
    const downloadsListEl = document.getElementById('account-downloads-list');

    let currentTab = 'bookmarks';
    
    // Multi-selection states per tab
    const selectMode = {
      bookmarks: false,
      comments: false,
      downloads: false
    };

    const selectedIds = {
      bookmarks: new Set(),
      comments: new Set(),
      downloads: new Set()
    };

    // Ensure initial downloads exist in localStorage
    try {
      const existingDl = localStorage.getItem(STORAGE_DOWNLOADS_KEY);
      if (!existingDl) {
        localStorage.setItem(STORAGE_DOWNLOADS_KEY, JSON.stringify(DEFAULT_INITIAL_DOWNLOADS));
      }
    } catch (e) {}

    // Initial render
    renderAll();

    // Sign out listener
    if (signoutBtn) {
      signoutBtn.addEventListener('click', handleSignOut);
    }

    // Edit Profile Modal initialization
    initEditProfileModal();

    // Account Tab Actions & Modals initialization
    initAccountModals();

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

        if (currentTab === 'account') {
          renderAccountTab();
        }

        renderTabContent(currentTab, true);
      });
    });

    // Custom event listeners
    window.addEventListener('auth-state-changed', renderAll);
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
      
      // Match posts by id or slug
      return allPosts.filter(p => ids.includes(p.id) || ids.includes(p.slug));
    }

    function getComments() {
      const session = getSession();
      // If user has a Local Account, they cannot comment!
      if (session && (session.isLocal || session.provider === 'local')) {
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

    function getDownloads() {
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

    function generateDicebear(seed = 'radiology') {
      if (typeof window !== 'undefined' && window.DiceBear && typeof window.DiceBear.getRandomAvatar === 'function') {
        return window.DiceBear.getRandomAvatar(seed);
      }
      return '';
    }

    function handleSignOut() {
      if (isSigningOut) return;
      isSigningOut = true;

      // Immediately hide modal if open to prevent any card flash
      const overlay = document.getElementById('edit-profile-overlay');
      if (overlay) overlay.classList.add('is-hidden');

      // Crucial: Keep logged-out prompt hidden so "Sign In Required" never flashes or shows in the background!
      if (loggedOutView) {
        loggedOutView.classList.add('is-hidden');
      }

      if (loggingOutOverlay) {
        loggingOutOverlay.classList.remove('is-hidden');
      }

      setTimeout(() => {
        if (window.RadiologyAuth && typeof window.RadiologyAuth.clearSession === 'function') {
          window.RadiologyAuth.clearSession();
        } else {
          localStorage.removeItem('my_radiology_user_session');
        }
        window.location.href = '../login/index.html';
      }, 450);
    }

    /* ==========================================================================
       RENDER ALL
       ========================================================================== */

    function renderAll() {
      if (isSigningOut) return;
      const session = getSession();

      if (session && (session.name || session.email)) {
        if (signedInView) signedInView.classList.remove('is-hidden');
        if (loggedOutView) loggedOutView.classList.add('is-hidden');

        const isLocal = session.isLocal === true || session.provider === 'local';
        document.documentElement.setAttribute('data-account-type', isLocal ? 'local' : 'google');
        if (signedInView) signedInView.setAttribute('data-account-type', isLocal ? 'local' : 'google');

        if (nameEl) nameEl.textContent = session.name || (isLocal ? 'Clinical Radiologist' : 'Akshay Patel');
        
        if (emailEl) {
          if (isLocal) {
            emailEl.textContent = 'Local Profile';
            emailEl.title = 'Local Profile';
          } else {
            emailEl.textContent = session.email || 'Verified Google Account';
            emailEl.title = 'Google Account';
          }
        }

        if (typeTagEl) {
          typeTagEl.textContent = isLocal ? 'Local Account' : 'Google Verified';
          typeTagEl.className = isLocal ? 'account-type-tag tag-local' : 'account-type-tag tag-google';
        }

        // Edit Profile button is strictly exclusive to Local Accounts!
        if (editProfileBtn) {
          editProfileBtn.classList.toggle('is-hidden', !isLocal);
        }

        if (providerBadgeEl) {
          if (isLocal) {
            providerBadgeEl.className = 'account-google-badge badge-local';
            providerBadgeEl.title = 'Local Account';
            providerBadgeEl.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            `;
          } else {
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
        }

        if (memberDateEl) {
          const date = session.joinedDate || (session.timestamp ? new Date(session.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'September 25, 2026');
          memberDateEl.textContent = date;
        }

        if (avatarImg) {
          avatarImg.onerror = () => {
            avatarImg.src = generateDicebear(session.name || 'radiology-user');
          };
          const targetAvatar = session.avatar || generateDicebear(session.name || 'radiology-user');
          if (targetAvatar) {
            avatarImg.src = targetAvatar;
          }
          avatarImg.alt = session.name || 'User avatar';
        }
      } else {
        if (signedInView) signedInView.classList.add('is-hidden');
        if (loggedOutView) loggedOutView.classList.remove('is-hidden');
      }

      // Update counters
      const bookmarks = getBookmarkedPosts();
      const comments = getComments();
      const downloads = getDownloads();

      updateCounterSafe(bookmarksCountEl, bookmarks.length);
      updateCounterSafe(commentsCountEl, comments.length);
      updateCounterSafe(downloadsCountEl, downloads.length);

      // Render Active Tab
      renderTabContent(currentTab, false);
    }

    let tabSwitchTimer = null;

    function renderTabSkeleton(tab) {
      if (tab === 'bookmarks' && bookmarksListEl) {
        bookmarksListEl.innerHTML = `
          <div class="account-tab-toolbar skeleton-toolbar">
            <div class="skeleton-pill skeleton-shimmer" style="width: 140px; height: 16px;"></div>
            <div class="skeleton-pill skeleton-shimmer" style="width: 110px; height: 28px; border-radius: 6px;"></div>
          </div>
          <div class="account-items-grid">
            <div class="account-item-card skeleton-card">
              <div class="account-item-thumb-box skeleton-thumb skeleton-shimmer"></div>
              <div class="account-item-content skeleton-content">
                <div class="skeleton-line skeleton-shimmer" style="width: 22%; height: 12px; margin-bottom: 8px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 80%; height: 16px; margin-bottom: 8px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 50%; height: 12px;"></div>
              </div>
            </div>
            <div class="account-item-card skeleton-card">
              <div class="account-item-thumb-box skeleton-thumb skeleton-shimmer"></div>
              <div class="account-item-content skeleton-content">
                <div class="skeleton-line skeleton-shimmer" style="width: 18%; height: 12px; margin-bottom: 8px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 68%; height: 16px; margin-bottom: 8px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 42%; height: 12px;"></div>
              </div>
            </div>
            <div class="account-item-card skeleton-card">
              <div class="account-item-thumb-box skeleton-thumb skeleton-shimmer"></div>
              <div class="account-item-content skeleton-content">
                <div class="skeleton-line skeleton-shimmer" style="width: 26%; height: 12px; margin-bottom: 8px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 84%; height: 16px; margin-bottom: 8px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 58%; height: 12px;"></div>
              </div>
            </div>
          </div>
        `;
      } else if (tab === 'comments' && commentsListEl) {
        commentsListEl.innerHTML = `
          <div class="account-tab-toolbar skeleton-toolbar">
            <div class="skeleton-pill skeleton-shimmer" style="width: 160px; height: 16px;"></div>
            <div class="skeleton-pill skeleton-shimmer" style="width: 110px; height: 28px; border-radius: 6px;"></div>
          </div>
          <div class="account-comments-stack">
            <div class="account-comment-card skeleton-card">
              <div class="comment-card-main skeleton-content">
                <div class="skeleton-line skeleton-shimmer" style="width: 35%; height: 12px; margin-bottom: 10px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 90%; height: 14px; margin-bottom: 6px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 65%; height: 14px;"></div>
              </div>
            </div>
            <div class="account-comment-card skeleton-card">
              <div class="comment-card-main skeleton-content">
                <div class="skeleton-line skeleton-shimmer" style="width: 28%; height: 12px; margin-bottom: 10px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 85%; height: 14px; margin-bottom: 6px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 50%; height: 14px;"></div>
              </div>
            </div>
          </div>
        `;
      } else if (tab === 'downloads' && downloadsListEl) {
        downloadsListEl.innerHTML = `
          <div class="account-tab-toolbar skeleton-toolbar">
            <div class="skeleton-pill skeleton-shimmer" style="width: 140px; height: 16px;"></div>
            <div class="skeleton-pill skeleton-shimmer" style="width: 110px; height: 28px; border-radius: 6px;"></div>
          </div>
          <div class="account-downloads-stack">
            <div class="account-download-card skeleton-card">
              <div class="skeleton-thumb skeleton-shimmer" style="width: 48px; height: 48px; border-radius: 8px;"></div>
              <div class="download-card-main skeleton-content">
                <div class="skeleton-line skeleton-shimmer" style="width: 25%; height: 12px; margin-bottom: 8px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 75%; height: 16px; margin-bottom: 8px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 40%; height: 12px;"></div>
              </div>
            </div>
            <div class="account-download-card skeleton-card">
              <div class="skeleton-thumb skeleton-shimmer" style="width: 48px; height: 48px; border-radius: 8px;"></div>
              <div class="download-card-main skeleton-content">
                <div class="skeleton-line skeleton-shimmer" style="width: 20%; height: 12px; margin-bottom: 8px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 70%; height: 16px; margin-bottom: 8px;"></div>
                <div class="skeleton-line skeleton-shimmer" style="width: 35%; height: 12px;"></div>
              </div>
            </div>
          </div>
        `;
      } else if (tab === 'account') {
        const settingsContainer = document.getElementById('account-settings-content');
        if (settingsContainer) {
          // Keep pristine native static markup with instant zero-CLS rendering
        }
      }
    }

    function renderTabContent(tab, showSkeleton = false) {
      if (showSkeleton) {
        renderTabSkeleton(tab);
        if (tabSwitchTimer) clearTimeout(tabSwitchTimer);
        tabSwitchTimer = setTimeout(() => {
          if (tab === 'bookmarks') renderBookmarks();
          else if (tab === 'comments') renderComments();
          else if (tab === 'downloads') renderDownloads();
          else if (tab === 'account') renderAccountTab();
        }, 130);
      } else {
        if (tab === 'bookmarks') renderBookmarks();
        else if (tab === 'comments') renderComments();
        else if (tab === 'downloads') renderDownloads();
        else if (tab === 'account') renderAccountTab();
      }
    }

    /* ==========================================================================
       1. BOOKMARKS TAB RENDERER & ACTIONS (Cookie-Based)
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
            <h4 class="account-empty-title">No saved bookmarks in your cookie storage</h4>
            <p class="account-empty-desc">When you click "Save" on any clinical protocol or physics pearling across the guide, it immediately saves to your browser cookie and reflects here.</p>
            <a href="../index.html" class="account-empty-btn">Browse Clinical Protocols</a>
          </div>
        `;
        return;
      }

      const toolbarHtml = `
        <div class="account-tab-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-count">${bookmarks.length} Saved Bookmark${bookmarks.length === 1 ? '' : 's'} (Cookie)</span>
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
              <a href="${postLink}" class="account-action-primary-btn" title="Open and read protocol">Open</a>
              <button type="button" class="account-action-delete-btn btn-delete-single-bookmark" data-id="${b.id}" title="Remove from Bookmarks" aria-label="Remove bookmark">
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
          window.RadiologyAuth.showToast(`Removed ${idsToDelete.length} bookmark${idsToDelete.length === 1 ? '' : 's'} from cookie`, 'info');
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
       2. COMMENTS TAB RENDERER (ENFORCES LOCAL ACCOUNT RESTRICTION)
       ========================================================================== */
    function renderComments() {
      if (!commentsListEl) return;

      const session = getSession();
      const isLocal = session && (session.isLocal === true || session.provider === 'local');

      // Rule: Local Accounts CANNOT comment! Show clean informative explanation.
      if (isLocal) {
        commentsListEl.innerHTML = `
          <div class="account-empty-state local-restricted-state">
            <div class="restricted-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h4 class="account-empty-title">Public Commenting Requires Google Account</h4>
            <p class="account-empty-desc">
              You are currently using a <strong>Private Local Account</strong>. Because local accounts store all data exclusively in your browser cookies without uploading to servers, public clinical discussion posting is disabled to ensure verified, high-quality medical discourse.
            </p>
            <div class="restricted-actions-row">
              <a href="../login/index.html?mode=google" class="account-empty-btn">
                <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Connect Google Account to Comment</span>
              </a>
            </div>
          </div>
        `;
        updateCounterSafe(commentsCountEl, 0);
        return;
      }

      // If Google Account: render existing comments
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
       3. DOWNLOADS TAB RENDERER & ACTIONS
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
            <h4 class="account-empty-title">No downloaded reference files</h4>
            <p class="account-empty-desc">Download textbooks and clinical pocket-cards from the Best Books section for offline diagnostic study.</p>
            <a href="/books/" class="account-empty-btn">Explore Reference Library</a>
          </div>
        `;
        return;
      }

      const toolbarHtml = `
        <div class="account-tab-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-count">${downloads.length} Downloaded Reference File${downloads.length === 1 ? '' : 's'}</span>
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
      try {
        let list = JSON.parse(localStorage.getItem(STORAGE_DOWNLOADS_KEY) || '[]');
        list = list.filter(d => !idsToDelete.includes(d.id));
        localStorage.setItem(STORAGE_DOWNLOADS_KEY, JSON.stringify(list));
      } catch (e) {}

      const updated = getDownloads();
      updateCounterSafe(downloadsCountEl, updated.length);
    }

    /* ==========================================================================
       4. EDIT PROFILE MODAL (Change Name and Avatar Anytime)
       ========================================================================== */
    function initEditProfileModal() {
      const overlay = document.getElementById('edit-profile-overlay');
      const modal = document.getElementById('edit-profile-modal');
      const closeBtn = document.getElementById('edit-profile-close-btn');
      const form = document.getElementById('edit-profile-form');
      const nameInput = document.getElementById('edit-modal-name-input');
      const previewImg = document.getElementById('edit-modal-avatar-preview');
      const randomBtn = document.getElementById('edit-btn-random-avatar');
      const fileInput = document.getElementById('edit-modal-file-upload');

      if (!overlay || !form) return;

      let modalAvatarData = '';

      function syncFloatingLabel() {
        if (!nameInput) return;
        if (nameInput.value.trim().length > 0) {
          nameInput.classList.add('has-value');
        } else {
          nameInput.classList.remove('has-value');
        }
      }

      if (nameInput) {
        nameInput.addEventListener('input', syncFloatingLabel);
        nameInput.addEventListener('change', syncFloatingLabel);
        nameInput.addEventListener('blur', syncFloatingLabel);
      }

      function openModal() {
        const session = getSession();
        if (!session) return;

        const isLocal = session.isLocal === true || session.provider === 'local';
        if (!isLocal) return; // Strict: editing profile is exclusive to Local Account!

        if (nameInput) {
          nameInput.value = session.name || '';
          syncFloatingLabel();
        }
        modalAvatarData = session.avatar || generateDicebear(session.name || 'user');
        if (previewImg) {
          previewImg.src = modalAvatarData;
        }

        if (modal) {
          modal.style.transform = '';
          modal.style.transition = '';
        }
        overlay.classList.add('is-active');
        document.body.classList.add('modal-open');
        if (nameInput) {
          setTimeout(() => nameInput.focus(), 60);
        }
      }

      function closeModal() {
        if (modal) {
          modal.style.transform = '';
          modal.style.transition = '';
        }
        overlay.classList.remove('is-active');
        document.body.classList.remove('modal-open');
        if (nameInput) nameInput.blur();
      }

      if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openModal);
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
      }
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });

      // Mobile Touch Drag Swipe Down to dismiss (matches search & theme modal)
      if (modal) {
        let touchStartY = 0;
        let touchCurrentY = 0;
        let isDraggingSheet = false;
        let sheetRafId = null;

        modal.addEventListener('touchstart', (e) => {
          if (window.innerWidth >= 640) return;
          if (e.target === nameInput || (fileInput && e.target === fileInput)) return;
          touchStartY = e.touches[0].clientY;
          touchCurrentY = touchStartY;
          isDraggingSheet = true;
        }, { passive: true });

        modal.addEventListener('touchmove', (e) => {
          if (!isDraggingSheet || window.innerWidth >= 640) return;
          touchCurrentY = e.touches[0].clientY;
          const deltaY = touchCurrentY - touchStartY;
          if (deltaY > 0) {
            if (!sheetRafId) {
              sheetRafId = requestAnimationFrame(() => {
                modal.style.transition = 'none';
                modal.style.transform = `translate3d(0, ${deltaY}px, 0)`;
                sheetRafId = null;
              });
            }
          }
        }, { passive: true });

        modal.addEventListener('touchend', () => {
          if (!isDraggingSheet || window.innerWidth >= 640) return;
          isDraggingSheet = false;
          if (sheetRafId) {
            cancelAnimationFrame(sheetRafId);
            sheetRafId = null;
          }
          const deltaY = touchCurrentY - touchStartY;
          modal.style.transition = '';
          if (deltaY > 60) {
            closeModal();
          } else {
            modal.style.transform = '';
          }
        });
      }

      if (randomBtn) {
        randomBtn.addEventListener('click', () => {
          const seed = 'rand-avatar-' + Math.random().toString(36).substring(2, 9);
          const newAv = generateDicebear(seed);
          if (newAv) {
            modalAvatarData = newAv;
            if (previewImg) {
              previewImg.src = modalAvatarData;
              previewImg.classList.remove('is-animating');
              void previewImg.offsetWidth;
              previewImg.classList.add('is-animating');
            }
          }
        });
      }

      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file || !file.type.startsWith('image/')) return;
          if (file.size > 2 * 1024 * 1024) {
            if (window.RadiologyAuth) window.RadiologyAuth.showToast('Image too large (>2MB)', 'warning');
            return;
          }

          const reader = new FileReader();
          reader.onload = function (evt) {
            const img = new Image();
            img.onload = function () {
              const canvas = document.createElement('canvas');
              const size = 96;
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext('2d');
              const minDim = Math.min(img.width, img.height);
              ctx.drawImage(img, (img.width - minDim) / 2, (img.height - minDim) / 2, minDim, minDim, 0, 0, size, size);
              modalAvatarData = canvas.toDataURL('image/jpeg', 0.85);
              if (previewImg) previewImg.src = modalAvatarData;
            };
            img.src = evt.target.result;
          };
          reader.readAsDataURL(file);
        });
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = nameInput ? nameInput.value.trim() : '';
        if (!newName) return;

        if (window.RadiologyAuth && typeof window.RadiologyAuth.updateProfile === 'function') {
          window.RadiologyAuth.updateProfile({
            name: newName,
            avatar: modalAvatarData
          });
          if (window.RadiologyAuth.showToast) {
            window.RadiologyAuth.showToast('Profile updated successfully!', 'success');
          }
        } else {
          try {
            const raw = localStorage.getItem('my_radiology_user_session');
            if (raw) {
              const session = JSON.parse(raw);
              session.name = newName;
              session.avatar = modalAvatarData;
              localStorage.setItem('my_radiology_user_session', JSON.stringify(session));
              window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: session }));
            }
          } catch (err) {}
        }

        closeModal();
        renderAll();
      });
    }

    /* ==========================================================================
       5. ACCOUNT TAB & DANGER ZONE ACTIONS
       ========================================================================== */
    function renderAccountTab() {
      const resetDescEl = document.getElementById('danger-reset-desc');
      const deleteDescEl = document.getElementById('danger-delete-desc');

      if (resetDescEl) {
        resetDescEl.textContent = 'Resets your app data while keeping your profile.';
      }
      if (deleteDescEl) {
        deleteDescEl.textContent = 'Permanently deletes your account and all associated data.';
      }
    }

    function initAccountModals() {
      // 1. Reset Account Modal elements
      const resetBtn = document.getElementById('btn-reset-account');
      const resetOverlay = document.getElementById('modal-reset-account-overlay');
      const resetModal = resetOverlay ? resetOverlay.querySelector('.edit-profile-modal') : null;
      const resetCloseBtn = document.getElementById('modal-reset-close-btn');
      const resetConfirmBtn = document.getElementById('modal-reset-confirm-btn');

      // 2. Delete Account Modal elements
      const deleteBtn = document.getElementById('btn-delete-account');
      const deleteOverlay = document.getElementById('modal-delete-account-overlay');
      const deleteModal = deleteOverlay ? deleteOverlay.querySelector('.edit-profile-modal') : null;
      const deleteCloseBtn = document.getElementById('modal-delete-close-btn');
      const deleteConfirmBtn = document.getElementById('modal-delete-confirm-btn');

      const streakNumEl = document.getElementById('streak-count-num');
      const loggingOutOverlay = document.getElementById('logging-out-overlay');

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
          resetConfirmBtn.addEventListener('click', () => {
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
              window.RadiologyAuth.showToast('App data reset successfully while keeping your profile.', 'info');
            }
            renderAll();
          });
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
          deleteConfirmBtn.addEventListener('click', () => {
            closeAllModals();
            if (loggingOutOverlay) {
              const textEl = loggingOutOverlay.querySelector('.logging-out-text');
              if (textEl) textEl.textContent = 'Permanently deleting account & all associated data...';
              loggingOutOverlay.classList.remove('is-hidden');
            }
            if (window.RadiologyAuth && typeof window.RadiologyAuth.deleteAccount === 'function') {
              window.RadiologyAuth.deleteAccount();
            } else if (window.RadiologyAuth && typeof window.RadiologyAuth.clearSession === 'function') {
              window.RadiologyAuth.clearSession();
            }
            setTimeout(() => {
              window.location.href = '../login/index.html';
            }, 500);
          });
        }
      }

      // Global Escape handler for modals
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const editOverlay = document.getElementById('edit-profile-overlay');
          if (editOverlay && editOverlay.classList.contains('is-active')) {
            editOverlay.classList.remove('is-active');
            document.body.classList.remove('modal-open');
          }
          if (resetOverlay && resetOverlay.classList.contains('is-active')) {
            closeAllModals();
          }
          if (deleteOverlay && deleteOverlay.classList.contains('is-active')) {
            closeAllModals();
          }
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
