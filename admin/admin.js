/**
 * admin.js - Visual Radiology Protocol CMS Controller
 * 
 * Capabilities:
 * - Visual Post Browser with filtering, searching, and sorting
 * - Pinned Post Controller (Visual 1-click Pin & Swap)
 * - Popular Posts #1 to #5 Ranking Engine & Conflict Resolution
 * - Comprehensive Metadata Editor (Modal with Live Image Preview)
 * - Topic Manager (Count stimulation & Global Topic Renaming)
 * - Add, Duplicate, and Delete Clinical Protocols
 * - Export to clean posts.json and window.POSTS_DATA (posts-data.js)
 * - Instant Live-Preview synchronization via localStorage
 */

(function () {
  'use strict';

  const DRAFT_STORAGE_KEY = 'radiology_admin_draft_posts';

  let posts = [];
  let originalPosts = [];
  let filterTopic = 'all';
  let filterStatus = 'all';
  let searchQuery = '';
  let sortOption = 'default';
  let editingPostId = null;

  // Temporary chip arrays for modal form
  let currentModalTags = [];
  let currentModalKeywords = [];

  /**
   * Initialize Data Source
   */
  async function initData() {
    // 1. Try local draft
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          posts = parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read draft from localStorage', e);
    }

    // 2. If no local draft, fetch /data/posts.json
    if (!posts || posts.length === 0) {
      try {
        const res = await fetch('/data/posts.json');
        if (res.ok) {
          posts = await res.json();
        }
      } catch (err) {
        console.warn('Could not fetch /data/posts.json, checking window.POSTS_DATA', err);
      }
    }

    // 3. Fallback to window.POSTS_DATA
    if ((!posts || posts.length === 0) && typeof window.POSTS_DATA !== 'undefined' && Array.isArray(window.POSTS_DATA)) {
      posts = JSON.parse(JSON.stringify(window.POSTS_DATA));
    }

    originalPosts = JSON.parse(JSON.stringify(posts));

    renderAll();
    setupEventListeners();
  }

  /**
   * Save current draft state to localStorage
   */
  function persistDraft() {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(posts, null, 2));
    } catch (e) {
      console.error('Error saving draft:', e);
    }
    updateDraftIndicator();
  }

  function updateDraftIndicator() {
    const indicator = document.getElementById('admin-save-indicator');
    if (indicator) {
      indicator.textContent = 'Saved in local draft';
      indicator.style.opacity = '1';
      setTimeout(() => {
        if (indicator) indicator.style.opacity = '0.75';
      }, 1500);
    }
  }

  /**
   * Render All Panels
   */
  function renderAll() {
    renderPinnedOverview();
    renderPopularSlots();
    renderTopicChips();
    renderPostsList();
  }

  /**
   * Format ISO date
   */
  function formatDate(dateStr) {
    if (!dateStr) return 'No date';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = parseInt(parts[1], 10) - 1;
        return `${months[m] || parts[1]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  /**
   * 1. Render Pinned Post Overview Card
   */
  function renderPinnedOverview() {
    const container = document.getElementById('admin-pinned-container');
    if (!container) return;

    const pinnedPost = posts.find((p) => p.pinned === true);

    if (!pinnedPost) {
      container.innerHTML = `
        <div class="admin-pinned-post-box" style="border-style: dashed; justify-content: center; text-align: center; padding: 20px;">
          <p style="font-size: 13px; color: var(--color-text-tertiary); margin: 0 0 10px 0;">
            No post is currently set as <strong>Pinned</strong>. The hero banner on the main page defaults to the first post.
          </p>
          <button type="button" class="admin-btn admin-btn-accent" id="btn-quick-pin-first">
            Pin First Post
          </button>
        </div>
      `;
      const quickBtn = document.getElementById('btn-quick-pin-first');
      if (quickBtn && posts.length > 0) {
        quickBtn.onclick = () => setPinnedPost(posts[0].id);
      }
      return;
    }

    container.innerHTML = `
      <div class="admin-pinned-post-box">
        <img src="${pinnedPost.thumbnail}" alt="${pinnedPost.title}" class="admin-pinned-thumb" />
        <div class="admin-pinned-content">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
            <span class="admin-pinned-tag">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>Current Pinned Post</span>
            </span>
            <button type="button" class="admin-btn" style="padding: 2px 7px; font-size: 11px;" id="btn-unpin-current">
              Unpin
            </button>
          </div>
          <h4 class="admin-pinned-title">${pinnedPost.title}</h4>
          <div class="admin-pinned-meta">
            <span>${pinnedPost.Topic}</span> • <span>${pinnedPost.readTime || '5 min'}</span> • <span>${formatDate(pinnedPost.publishedAt)}</span>
          </div>
        </div>
      </div>
    `;

    const unpinBtn = document.getElementById('btn-unpin-current');
    if (unpinBtn) {
      unpinBtn.onclick = () => {
        pinnedPost.pinned = false;
        persistDraft();
        renderAll();
        showToast('Pinned post removed', 'info');
      };
    }
  }

  /**
   * 2. Render Popular Posts Top 5 Slots
   */
  function renderPopularSlots() {
    const deck = document.getElementById('admin-popular-slots');
    if (!deck) return;

    let html = '';
    for (let slot = 1; slot <= 5; slot++) {
      const match = posts.find((p) => p.popular && p.popular.enabled && Number(p.popular.position) === slot);
      const isHero = slot === 1;

      if (match) {
        html += `
          <div class="admin-popular-slot-card">
            <div class="admin-slot-header">
              <span class="admin-slot-rank ${isHero ? 'rank-hero' : ''}">#${slot} ${isHero ? '(Featured)' : ''}</span>
              <button type="button" class="admin-slot-action remove-popular-slot" data-id="${match.id}" title="Remove from Popular # ${slot}">
                ✕ Remove
              </button>
            </div>
            <img src="${match.thumbnail}" alt="${match.title}" class="admin-slot-img" />
            <h5 class="admin-slot-title">${match.title}</h5>
            <div style="font-size: 10px; color: var(--color-text-tertiary);">${match.Topic}</div>
          </div>
        `;
      } else {
        html += `
          <div class="admin-popular-slot-card is-empty">
            <div class="admin-slot-header">
              <span class="admin-slot-rank ${isHero ? 'rank-hero' : ''}">#${slot} ${isHero ? '(Featured)' : ''}</span>
              <span style="font-size: 10px; color: var(--color-text-tertiary);">Empty</span>
            </div>
            <div style="height: 48px; border-radius: 4px; background-color: var(--color-bg-elevated); display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--color-text-tertiary); border: 1px dashed var(--color-border);">
              Unassigned
            </div>
            <button type="button" class="admin-slot-action assign-popular-slot" data-slot="${slot}">
              + Assign Post
            </button>
          </div>
        `;
      }
    }

    deck.innerHTML = html;

    // Attach slot remove handlers
    deck.querySelectorAll('.remove-popular-slot').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const post = posts.find((p) => p.id === id);
        if (post && post.popular) {
          post.popular.enabled = false;
          post.popular.position = 0;
          persistDraft();
          renderAll();
          showToast(`Removed from Popular rank`, 'info');
        }
      };
    });

    // Attach assign prompt handlers
    deck.querySelectorAll('.assign-popular-slot').forEach((btn) => {
      btn.onclick = () => {
        const slot = parseInt(btn.getAttribute('data-slot'), 10);
        openAssignSlotPrompt(slot);
      };
    });
  }

  /**
   * Prompt user to pick a post for a specific popular slot
   */
  function openAssignSlotPrompt(slot) {
    const unassigned = posts.filter((p) => !p.popular || !p.popular.enabled || Number(p.popular.position) !== slot);
    if (unassigned.length === 0) {
      alert('All posts are already assigned.');
      return;
    }

    const options = unassigned.map((p, idx) => `${idx + 1}. [${p.Topic}] ${p.title}`).join('\n');
    const pick = prompt(`Select a post to assign to Popular Slot #${slot}:\n\n${options}\n\nEnter number (1-${unassigned.length}):`);
    if (!pick) return;

    const chosenIdx = parseInt(pick, 10) - 1;
    if (isNaN(chosenIdx) || chosenIdx < 0 || chosenIdx >= unassigned.length) {
      alert('Invalid selection.');
      return;
    }

    const chosenPost = unassigned[chosenIdx];
    setPopularRank(chosenPost.id, slot);
  }

  /**
   * Set Pinned Post
   */
  function setPinnedPost(targetId) {
    posts.forEach((p) => {
      p.pinned = (p.id === targetId);
    });
    persistDraft();
    renderAll();
    showToast('Pinned post updated', 'success');
  }

  /**
   * Set Popular Rank for a post (with automatic conflict shift/swap)
   */
  function setPopularRank(targetId, newRank) {
    const targetPost = posts.find((p) => p.id === targetId);
    if (!targetPost) return;

    if (!targetPost.popular) {
      targetPost.popular = { enabled: false, position: 0 };
    }

    if (newRank === 0 || !newRank) {
      targetPost.popular.enabled = false;
      targetPost.popular.position = 0;
    } else {
      // Check if another post already has this rank
      const existing = posts.find((p) => p.id !== targetId && p.popular && p.popular.enabled && Number(p.popular.position) === newRank);
      if (existing) {
        // Swap or move existing to another rank
        const oldRank = targetPost.popular.position || 0;
        existing.popular.position = oldRank > 0 ? oldRank : 0;
        existing.popular.enabled = (existing.popular.position > 0);
      }

      targetPost.popular.enabled = true;
      targetPost.popular.position = newRank;
    }

    persistDraft();
    renderAll();
    showToast(`Popular rank updated`, 'success');
  }

  /**
   * 3. Render Topic Chips
   */
  function renderTopicChips() {
    const container = document.getElementById('admin-topic-chips');
    const topicSelect = document.getElementById('filter-topic-select');
    if (!container) return;

    const topicCounts = {};
    posts.forEach((p) => {
      const top = (p.Topic || 'Uncategorized').trim();
      topicCounts[top] = (topicCounts[top] || 0) + 1;
    });

    const topics = Object.keys(topicCounts).sort();

    // Render chips
    let chipsHtml = `
      <button type="button" class="admin-topic-chip ${filterTopic === 'all' ? 'is-active' : ''}" data-topic="all">
        All Topics (${posts.length})
      </button>
    `;

    topics.forEach((top) => {
      const isActive = filterTopic === top;
      chipsHtml += `
        <button type="button" class="admin-topic-chip ${isActive ? 'is-active' : ''}" data-topic="${top}">
          ${top} (${topicCounts[top]})
        </button>
      `;
    });

    container.innerHTML = chipsHtml;

    container.querySelectorAll('.admin-topic-chip').forEach((btn) => {
      btn.onclick = () => {
        filterTopic = btn.getAttribute('data-topic');
        if (topicSelect) topicSelect.value = filterTopic;
        renderTopicChips();
        renderPostsList();
      };
    });

    // Populate dropdown selector
    if (topicSelect) {
      topicSelect.innerHTML = `
        <option value="all">All Topics (${posts.length})</option>
        ${topics.map((top) => `<option value="${top}" ${filterTopic === top ? 'selected' : ''}>${top} (${topicCounts[top]})</option>`).join('')}
      `;
    }
  }

  /**
   * 4. Render Main Posts Grid
   */
  function renderPostsList() {
    const grid = document.getElementById('admin-posts-grid');
    const countBadge = document.getElementById('admin-posts-count');
    if (!grid) return;

    // Apply filtering
    let filtered = posts.filter((post) => {
      // 1. Topic filter
      if (filterTopic !== 'all' && (post.Topic || '').trim() !== filterTopic) {
        return false;
      }

      // 2. Status filter
      if (filterStatus === 'pinned' && !post.pinned) {
        return false;
      }
      if (filterStatus === 'popular' && (!post.popular || !post.popular.enabled)) {
        return false;
      }
      if (filterStatus === 'unassigned' && ((post.popular && post.popular.enabled) || post.pinned)) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = (post.title || '').toLowerCase().includes(q);
        const inDesc = (post.description || '').toLowerCase().includes(q);
        const inTopic = (post.Topic || '').toLowerCase().includes(q);
        const inSlug = (post.slug || '').toLowerCase().includes(q);
        const inTags = (post.tags || []).some((t) => t.toLowerCase().includes(q));
        const inKeywords = (post.search?.keywords || []).some((k) => k.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inTopic && !inSlug && !inTags && !inKeywords) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortOption === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortOption === 'date-desc') {
        return (b.publishedAt || '').localeCompare(a.publishedAt || '');
      }
      if (sortOption === 'date-asc') {
        return (a.publishedAt || '').localeCompare(b.publishedAt || '');
      }
      if (sortOption === 'rank') {
        const rA = (a.popular && a.popular.enabled && a.popular.position) ? a.popular.position : 999;
        const rB = (b.popular && b.popular.enabled && b.popular.position) ? b.popular.position : 999;
        return rA - rB;
      }
      // default: pinned first, then popular, then original order
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const rA = (a.popular && a.popular.enabled && a.popular.position) ? a.popular.position : 999;
      const rB = (b.popular && b.popular.enabled && b.popular.position) ? b.popular.position : 999;
      return rA - rB;
    });

    if (countBadge) {
      countBadge.textContent = `${filtered.length} of ${posts.length} Protocols`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px 16px; text-align: center; color: var(--color-text-tertiary); background-color: var(--color-bg-surface); border: 1px dashed var(--color-border); border-radius: 8px;">
          <h4 style="font-size: 15px; margin: 0 0 8px 0; color: var(--color-text-secondary);">No clinical articles match your filters</h4>
          <p style="font-size: 13px; margin: 0 0 14px 0;">Try adjusting your search criteria or resetting filters.</p>
          <button type="button" class="admin-btn" id="btn-reset-filters">
            Reset Filters
          </button>
        </div>
      `;
      const resetBtn = document.getElementById('btn-reset-filters');
      if (resetBtn) {
        resetBtn.onclick = () => {
          filterTopic = 'all';
          filterStatus = 'all';
          searchQuery = '';
          const sInput = document.getElementById('admin-search-input');
          if (sInput) sInput.value = '';
          renderTopicChips();
          renderPostsList();
        };
      }
      return;
    }

    grid.innerHTML = filtered.map((post) => {
      const isPinned = post.pinned === true;
      const isPop = post.popular && post.popular.enabled;
      const popRank = isPop ? post.popular.position : 0;
      const tagCount = Array.isArray(post.tags) ? post.tags.length : 0;
      const kwCount = (post.search && Array.isArray(post.search.keywords)) ? post.search.keywords.length : 0;

      return `
        <article class="admin-post-card ${isPinned ? 'is-pinned-card' : ''}" data-id="${post.id}">
          <div class="admin-card-top-row">
            <div class="admin-card-thumb-wrap">
              <img src="${post.thumbnail}" alt="${post.title}" class="admin-card-thumb" loading="lazy" />
              <button type="button" class="admin-card-copy-thumb-btn" data-url="${post.thumbnail}" title="Copy direct image link">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              </button>
            </div>

            <div class="admin-card-main-info">
              <div class="admin-card-badges">
                <span class="admin-badge-topic">${post.Topic}</span>
                ${isPinned ? '<span class="admin-badge-pinned">★ Pinned</span>' : ''}
                ${isPop ? `<span class="admin-badge-popular">Rank #${popRank}</span>` : ''}
              </div>
              <h4 class="admin-card-title" title="${post.title}">${post.title}</h4>
              <p class="admin-card-desc">${post.description}</p>
            </div>
          </div>

          <!-- Quick Interactive Controls Bar -->
          <div class="admin-card-controls-row">
            <div class="admin-ctrl-group">
              <span class="admin-ctrl-label">Pin Status:</span>
              <button type="button" class="admin-pin-toggle-btn ${isPinned ? 'is-active' : ''}" data-id="${post.id}">
                ${isPinned ? '★ Pinned' : '☆ Pin Post'}
              </button>
            </div>

            <div class="admin-ctrl-group">
              <span class="admin-ctrl-label">Popular Rank:</span>
              <select class="admin-popular-select" data-id="${post.id}">
                <option value="0" ${!isPop ? 'selected' : ''}>Not Popular</option>
                <option value="1" ${isPop && popRank === 1 ? 'selected' : ''}>#1 - Hero</option>
                <option value="2" ${isPop && popRank === 2 ? 'selected' : ''}>#2</option>
                <option value="3" ${isPop && popRank === 3 ? 'selected' : ''}>#3</option>
                <option value="4" ${isPop && popRank === 4 ? 'selected' : ''}>#4</option>
                <option value="5" ${isPop && popRank === 5 ? 'selected' : ''}>#5</option>
              </select>
            </div>
          </div>

          <div class="admin-card-tags-row">
            <span class="admin-tag-pill">${tagCount} Tags</span>
            <span class="admin-tag-pill">${kwCount} Search Keywords</span>
            <span class="admin-tag-pill" style="margin-left: auto;">${post.readTime || '5 min'}</span>
          </div>

          <div class="admin-card-footer">
            <span>Published: ${formatDate(post.publishedAt)}</span>
            <div class="admin-card-actions">
              <button type="button" class="admin-card-btn btn-edit-post" data-id="${post.id}">
                Edit Metadata
              </button>
              <button type="button" class="admin-card-btn btn-duplicate-post" data-id="${post.id}" title="Duplicate">
                Copy
              </button>
              <button type="button" class="admin-card-btn btn-danger btn-delete-post" data-id="${post.id}" title="Delete">
                Delete
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    attachCardListeners();
  }

  /**
   * Attach Listeners to Rendered Cards
   */
  function attachCardListeners() {
    const grid = document.getElementById('admin-posts-grid');
    if (!grid) return;

    // Pin toggle
    grid.querySelectorAll('.admin-pin-toggle-btn').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const post = posts.find((p) => p.id === id);
        if (post) {
          if (post.pinned) {
            post.pinned = false;
            persistDraft();
            renderAll();
            showToast('Post unpinned', 'info');
          } else {
            setPinnedPost(id);
          }
        }
      };
    });

    // Popular Rank selector
    grid.querySelectorAll('.admin-popular-select').forEach((sel) => {
      sel.onchange = () => {
        const id = sel.getAttribute('data-id');
        const rank = parseInt(sel.value, 10);
        setPopularRank(id, rank);
      };
    });

    // Copy thumbnail URL
    grid.querySelectorAll('.admin-card-copy-thumb-btn').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-url');
        if (url) {
          navigator.clipboard.writeText(url).then(() => {
            showToast('Direct image URL copied to clipboard', 'success');
          });
        }
      };
    });

    // Edit Metadata Modal
    grid.querySelectorAll('.btn-edit-post').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        openEditModal(id);
      };
    });

    // Duplicate
    grid.querySelectorAll('.btn-duplicate-post').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        duplicatePost(id);
      };
    });

    // Delete
    grid.querySelectorAll('.btn-delete-post').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        deletePost(id);
      };
    });
  }

  /**
   * 5. Modal: Edit Post Metadata
   */
  function openEditModal(postId) {
    editingPostId = postId;
    const post = posts.find((p) => p.id === postId) || {
      id: `post-${Date.now()}`,
      slug: `new-protocol-${Date.now()}`,
      title: 'New Clinical Protocol',
      description: '',
      url: `#protocol-${Date.now()}`,
      thumbnail: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      alt: 'Clinical diagnostic image',
      Topic: 'Neuroradiology',
      tags: ['Diagnostic Criteria', 'Protocol'],
      readTime: '6 min read',
      publishedAt: new Date().toISOString().split('T')[0],
      pinned: false,
      popular: { enabled: false, position: 0 },
      search: { keywords: ['radiology', 'protocol'] },
      related: []
    };

    const modal = document.getElementById('admin-edit-modal');
    if (!modal) return;

    // Populate input values
    document.getElementById('edit-title').value = post.title || '';
    document.getElementById('edit-slug').value = post.slug || '';
    document.getElementById('edit-id').value = post.id || '';
    document.getElementById('edit-url').value = post.url || '';
    document.getElementById('edit-desc').value = post.description || '';
    document.getElementById('edit-topic').value = post.Topic || '';
    document.getElementById('edit-thumb').value = post.thumbnail || '';
    document.getElementById('edit-alt').value = post.alt || '';
    document.getElementById('edit-readtime').value = post.readTime || '';
    document.getElementById('edit-published').value = post.publishedAt || '';
    document.getElementById('edit-pinned').checked = (post.pinned === true);
    
    const isPop = (post.popular && post.popular.enabled);
    document.getElementById('edit-popular-enabled').checked = isPop;
    document.getElementById('edit-popular-rank').value = isPop ? (post.popular.position || 1) : 0;
    document.getElementById('edit-popular-rank').disabled = !isPop;

    // Live thumbnail preview
    const previewImg = document.getElementById('edit-thumb-preview');
    if (previewImg) previewImg.src = post.thumbnail || '';

    // Tags and Keywords Arrays
    currentModalTags = Array.isArray(post.tags) ? [...post.tags] : [];
    currentModalKeywords = (post.search && Array.isArray(post.search.keywords)) ? [...post.search.keywords] : [];
    renderModalChips('tags');
    renderModalChips('keywords');

    // Related posts checkboxes
    renderModalRelatedPosts(post.id, post.related || []);

    modal.classList.add('is-active');
  }

  function closeEditModal() {
    const modal = document.getElementById('admin-edit-modal');
    if (modal) modal.classList.remove('is-active');
    editingPostId = null;
  }

  function renderModalChips(type) {
    const container = document.getElementById(`edit-${type}-chips`);
    if (!container) return;

    const list = type === 'tags' ? currentModalTags : currentModalKeywords;

    container.innerHTML = `
      ${list.map((item, idx) => `
        <span class="admin-manager-chip">
          <span>${item}</span>
          <span class="admin-manager-chip-del" data-type="${type}" data-index="${idx}" title="Remove">✕</span>
        </span>
      `).join('')}
      <input type="text" class="admin-chip-input" id="edit-new-${type}-input" placeholder="+ Type and press Enter" />
    `;

    // Remove chip handler
    container.querySelectorAll('.admin-manager-chip-del').forEach((del) => {
      del.onclick = () => {
        const idx = parseInt(del.getAttribute('data-index'), 10);
        if (type === 'tags') {
          currentModalTags.splice(idx, 1);
        } else {
          currentModalKeywords.splice(idx, 1);
        }
        renderModalChips(type);
      };
    });

    // Add chip on Enter key
    const input = document.getElementById(`edit-new-${type}-input`);
    if (input) {
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = input.value.trim();
          if (val) {
            if (type === 'tags' && !currentModalTags.includes(val)) {
              currentModalTags.push(val);
            } else if (type === 'keywords' && !currentModalKeywords.includes(val.toLowerCase())) {
              currentModalKeywords.push(val.toLowerCase());
            }
            renderModalChips(type);
          }
        }
      };
    }
  }

  function renderModalRelatedPosts(currentId, currentRelated) {
    const container = document.getElementById('edit-related-container');
    if (!container) return;

    const otherPosts = posts.filter((p) => p.id !== currentId);
    container.innerHTML = otherPosts.map((p) => {
      const isChecked = currentRelated.includes(p.id);
      return `
        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 4px 0; cursor: pointer;">
          <input type="checkbox" class="edit-related-chk" value="${p.id}" ${isChecked ? 'checked' : ''} />
          <span><strong>[${p.Topic}]</strong> ${p.title}</span>
        </label>
      `;
    }).join('');
  }

  /**
   * Save Post from Modal Form
   */
  function savePostModal() {
    const title = document.getElementById('edit-title').value.trim();
    if (!title) {
      alert('Title is required');
      return;
    }

    const id = document.getElementById('edit-id').value.trim() || `post-${Date.now()}`;
    const slug = document.getElementById('edit-slug').value.trim() || id;
    const url = document.getElementById('edit-url').value.trim() || `#${slug}`;
    const desc = document.getElementById('edit-desc').value.trim();
    const topic = document.getElementById('edit-topic').value.trim() || 'General';
    const thumb = document.getElementById('edit-thumb').value.trim();
    const alt = document.getElementById('edit-alt').value.trim() || title;
    const readTime = document.getElementById('edit-readtime').value.trim() || '5 min read';
    const publishedAt = document.getElementById('edit-published').value.trim() || new Date().toISOString().split('T')[0];
    const pinned = document.getElementById('edit-pinned').checked;

    const popEnabled = document.getElementById('edit-popular-enabled').checked;
    const popRank = popEnabled ? parseInt(document.getElementById('edit-popular-rank').value, 10) : 0;

    // Collect related
    const relatedChecked = [];
    document.querySelectorAll('.edit-related-chk:checked').forEach((chk) => {
      relatedChecked.push(chk.value);
    });

    const updatedPost = {
      id,
      slug,
      title,
      description: desc,
      url,
      thumbnail: thumb,
      alt,
      Topic: topic,
      tags: [...currentModalTags],
      readTime,
      publishedAt,
      pinned,
      popular: {
        enabled: popEnabled,
        position: popRank
      },
      search: {
        keywords: [...currentModalKeywords]
      },
      related: relatedChecked
    };

    const existingIdx = posts.findIndex((p) => p.id === editingPostId);
    if (existingIdx !== -1) {
      posts[existingIdx] = updatedPost;
    } else {
      posts.unshift(updatedPost);
    }

    // Handle single-pinned rule
    if (pinned) {
      posts.forEach((p) => {
        if (p.id !== id) p.pinned = false;
      });
    }

    persistDraft();
    closeEditModal();
    renderAll();
    showToast('Clinical article metadata saved', 'success');
  }

  /**
   * Duplicate a post
   */
  function duplicatePost(postId) {
    const orig = posts.find((p) => p.id === postId);
    if (!orig) return;

    const clone = JSON.parse(JSON.stringify(orig));
    const stamp = Date.now().toString().slice(-4);
    clone.id = `${orig.id}-copy-${stamp}`;
    clone.slug = `${orig.slug}-copy-${stamp}`;
    clone.title = `${orig.title} (Copy)`;
    clone.url = `#${clone.slug}`;
    clone.pinned = false;
    clone.popular = { enabled: false, position: 0 };
    clone.publishedAt = new Date().toISOString().split('T')[0];

    posts.unshift(clone);
    persistDraft();
    renderAll();
    showToast('Post duplicated successfully', 'success');
  }

  /**
   * Delete a post
   */
  function deletePost(postId) {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;

    if (!confirm(`Are you sure you want to delete "${target.title}"?`)) {
      return;
    }

    posts = posts.filter((p) => p.id !== postId);
    persistDraft();
    renderAll();
    showToast('Post deleted', 'info');
  }

  /**
   * 6. Topic Manager Modal
   */
  function openTopicManager() {
    const modal = document.getElementById('admin-topic-modal');
    const listContainer = document.getElementById('topic-manager-list');
    if (!modal || !listContainer) return;

    const topicCounts = {};
    posts.forEach((p) => {
      const top = (p.Topic || 'Uncategorized').trim();
      topicCounts[top] = (topicCounts[top] || 0) + 1;
    });

    const topics = Object.keys(topicCounts).sort();

    listContainer.innerHTML = topics.map((top) => `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; background-color: var(--color-bg-body); border-radius: 6px; border: 1px solid var(--color-border);">
        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
          <input type="text" class="admin-form-input topic-rename-input" value="${top}" data-old-topic="${top}" style="padding: 5px 8px; font-size: 13px;" />
          <span style="font-size: 11.5px; color: var(--color-text-tertiary); white-space: nowrap;">(${topicCounts[top]} posts)</span>
        </div>
        <button type="button" class="admin-btn admin-btn-accent btn-rename-topic" data-old="${top}" style="padding: 4px 10px; font-size: 11.5px;">
          Rename
        </button>
      </div>
    `).join('');

    listContainer.querySelectorAll('.btn-rename-topic').forEach((btn) => {
      btn.onclick = () => {
        const oldName = btn.getAttribute('data-old');
        const input = listContainer.querySelector(`.topic-rename-input[data-old-topic="${oldName}"]`);
        if (!input) return;
        const newName = input.value.trim();
        if (!newName || newName === oldName) return;

        let renamedCount = 0;
        posts.forEach((p) => {
          if ((p.Topic || '').trim() === oldName) {
            p.Topic = newName;
            renamedCount++;
          }
        });

        persistDraft();
        openTopicManager();
        renderAll();
        showToast(`Renamed "${oldName}" to "${newName}" (${renamedCount} posts updated)`, 'success');
      };
    });

    modal.classList.add('is-active');
  }

  function closeTopicManager() {
    const modal = document.getElementById('admin-topic-modal');
    if (modal) modal.classList.remove('is-active');
  }

  /**
   * 7. Code Preview & Export Modal
   */
  function openCodeExportModal() {
    const modal = document.getElementById('admin-code-modal');
    const pre = document.getElementById('admin-code-box');
    if (!modal || !pre) return;

    pre.textContent = JSON.stringify(posts, null, 2);
    modal.classList.add('is-active');
  }

  function closeCodeExportModal() {
    const modal = document.getElementById('admin-code-modal');
    if (modal) modal.classList.remove('is-active');
  }

  /**
   * Export & Download files
   */
  function downloadPostsJson() {
    const jsonStr = JSON.stringify(posts, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'posts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded posts.json - Save in /data/posts.json', 'success');
  }

  function downloadPostsDataJs() {
    const content = `/**\n * posts-data.js\n * Central Data Source for Clinical Radiology Posts\n * Auto-generated from Radiology CMS\n */\nwindow.POSTS_DATA = ${JSON.stringify(posts, null, 2)};\n`;
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'posts-data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded posts-data.js - Save in /js/posts-data.js', 'success');
  }

  function copyCleanJson() {
    const jsonStr = JSON.stringify(posts, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      showToast('Clean JSON copied to clipboard!', 'success');
    });
  }

  function copyDataJs() {
    const content = `window.POSTS_DATA = ${JSON.stringify(posts, null, 2)};`;
    navigator.clipboard.writeText(content).then(() => {
      showToast('window.POSTS_DATA JavaScript copied to clipboard!', 'success');
    });
  }

  /**
   * 8. Import JSON
   */
  function openImportModal() {
    const modal = document.getElementById('admin-import-modal');
    if (modal) modal.classList.add('is-active');
  }

  function closeImportModal() {
    const modal = document.getElementById('admin-import-modal');
    if (modal) modal.classList.remove('is-active');
  }

  function handleImportSubmit() {
    const textarea = document.getElementById('import-json-textarea');
    if (!textarea) return;
    const raw = textarea.value.trim();
    if (!raw) {
      alert('Please paste JSON content');
      return;
    }

    try {
      // Allow pasting either raw JSON array or "window.POSTS_DATA = [...]"
      let clean = raw;
      if (clean.includes('window.POSTS_DATA =')) {
        clean = clean.replace(/window\.POSTS_DATA\s*=\s*/, '').replace(/;\s*$/, '');
      }

      const parsed = JSON.parse(clean);
      if (!Array.isArray(parsed)) {
        throw new Error('Data must be an array of posts');
      }

      posts = parsed;
      persistDraft();
      closeImportModal();
      renderAll();
      showToast(`Imported ${posts.length} clinical posts successfully!`, 'success');
    } catch (err) {
      alert('Invalid JSON: ' + err.message);
    }
  }

  /**
   * Reset to Original Defaults
   */
  function resetToDefaults() {
    if (!confirm('Reset all changes back to original posts.json? Any unsaved local edits will be discarded.')) {
      return;
    }
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    posts = JSON.parse(JSON.stringify(originalPosts));
    persistDraft();
    renderAll();
    showToast('Reset to original posts.json', 'info');
  }

  /**
   * Toast notification helper
   */
  function showToast(message, type = 'success') {
    let container = document.getElementById('admin-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'admin-toast-container';
      container.className = 'admin-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `admin-toast toast-${type}`;
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${type === 'success' 
          ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
          : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'}
      </svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, 2800);
  }

  /**
   * Event Listeners Setup
   */
  function setupEventListeners() {
    // Toolbar search
    const searchInput = document.getElementById('admin-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderPostsList();
      });
    }

    // Status filter
    const statusSelect = document.getElementById('filter-status-select');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        filterStatus = e.target.value;
        renderPostsList();
      });
    }

    // Topic filter dropdown
    const topicSelect = document.getElementById('filter-topic-select');
    if (topicSelect) {
      topicSelect.addEventListener('change', (e) => {
        filterTopic = e.target.value;
        renderTopicChips();
        renderPostsList();
      });
    }

    // Sort option
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortOption = e.target.value;
        renderPostsList();
      });
    }

    // Add new post button
    const btnNewPost = document.getElementById('btn-new-post');
    if (btnNewPost) {
      btnNewPost.onclick = () => openEditModal(null);
    }

    // Topic manager button
    const btnTopicManager = document.getElementById('btn-topic-manager');
    if (btnTopicManager) {
      btnTopicManager.onclick = openTopicManager;
    }

    // Export buttons
    const btnExportJson = document.getElementById('btn-export-json');
    if (btnExportJson) btnExportJson.onclick = downloadPostsJson;

    const btnExportJs = document.getElementById('btn-export-js');
    if (btnExportJs) btnExportJs.onclick = downloadPostsDataJs;

    const btnCopyJson = document.getElementById('btn-copy-json');
    if (btnCopyJson) btnCopyJson.onclick = copyCleanJson;

    const btnViewCode = document.getElementById('btn-view-code');
    if (btnViewCode) btnViewCode.onclick = openCodeExportModal;

    const btnImport = document.getElementById('btn-import-json');
    if (btnImport) btnImport.onclick = openImportModal;

    const btnReset = document.getElementById('btn-reset-defaults');
    if (btnReset) btnReset.onclick = resetToDefaults;

    // Modal close buttons
    const btnCloseEdit = document.getElementById('btn-close-edit-modal');
    if (btnCloseEdit) btnCloseEdit.onclick = closeEditModal;

    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    if (btnCancelEdit) btnCancelEdit.onclick = closeEditModal;

    const btnSaveEdit = document.getElementById('btn-save-edit');
    if (btnSaveEdit) btnSaveEdit.onclick = savePostModal;

    const btnCloseTopic = document.getElementById('btn-close-topic-modal');
    if (btnCloseTopic) btnCloseTopic.onclick = closeTopicManager;

    const btnCloseCode = document.getElementById('btn-close-code-modal');
    if (btnCloseCode) btnCloseCode.onclick = closeCodeExportModal;

    const btnCloseImport = document.getElementById('btn-close-import-modal');
    if (btnCloseImport) btnCloseImport.onclick = closeImportModal;

    const btnSubmitImport = document.getElementById('btn-submit-import');
    if (btnSubmitImport) btnSubmitImport.onclick = handleImportSubmit;

    // Live thumbnail preview on input
    const thumbInput = document.getElementById('edit-thumb');
    const thumbPreview = document.getElementById('edit-thumb-preview');
    if (thumbInput && thumbPreview) {
      thumbInput.addEventListener('input', () => {
        thumbPreview.src = thumbInput.value.trim();
      });
    }

    // Popular enable checkbox in modal
    const popChk = document.getElementById('edit-popular-enabled');
    const popRankInput = document.getElementById('edit-popular-rank');
    if (popChk && popRankInput) {
      popChk.addEventListener('change', () => {
        popRankInput.disabled = !popChk.checked;
        if (popChk.checked && parseInt(popRankInput.value, 10) === 0) {
          popRankInput.value = 1;
        }
      });
    }

    // Hotkey: ESC to close modals, Ctrl+S to save in edit modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeEditModal();
        closeTopicManager();
        closeCodeExportModal();
        closeImportModal();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const editModal = document.getElementById('admin-edit-modal');
        if (editModal && editModal.classList.contains('is-active')) {
          e.preventDefault();
          savePostModal();
        }
      }
    });
  }

  // Run on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initData);
  } else {
    initData();
  }
})();
