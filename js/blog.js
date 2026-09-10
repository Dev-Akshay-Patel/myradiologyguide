/**
 * blog.js - Central Content & Feed Controller
 * 
 * Powered by POSTS_DATA schema:
 * - Pinned Post dynamic rendering (pinned: true)
 * - Popular Posts dynamic ranking (popular.enabled, position: 1..5)
 * - Topic counters dynamic stimulation & topic filtering
 * - Multi-field real-time search with keyword highlight & instant grid filtering
 * - Blog grid cards with real-image skeleton shimmer, direct image link copying,
 *   and related post resolution.
 */
(function () {
  'use strict';

  // Fallback if posts-data.js hasn't loaded yet
  const POSTS = (typeof window !== 'undefined' && Array.isArray(window.POSTS_DATA))
    ? window.POSTS_DATA
    : [];

  const ITEMS_PER_PAGE = 6;
  let activePosts = [...POSTS];
  let currentPage = 1;
  let currentPaginationToken = 0;
  let activeFilterLabel = null;

  // Single SVG templates: Plus when not bookmarked, Minus when bookmarked
  const SVG_BOOKMARK_PLUS = `<svg class="blog-save-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14.5 10.6504H9.5" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M12 8.21094V13.2109" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M16.8199 2H7.17995C5.04995 2 3.31995 3.74 3.31995 5.86V19.95C3.31995 21.75 4.60995 22.51 6.18995 21.64L11.0699 18.93C11.5899 18.64 12.4299 18.64 12.9399 18.93L17.8199 21.64C19.3999 22.52 20.6899 21.76 20.6899 19.95V5.86C20.6799 3.74 18.9499 2 16.8199 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;

  const SVG_BOOKMARK_MINUS = `<svg class="blog-save-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14.5 10.6504H9.5" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M16.8199 2H7.17995C5.04995 2 3.31995 3.74 3.31995 5.86V19.95C3.31995 21.75 4.60995 22.51 6.18995 21.64L11.0699 18.93C11.5899 18.64 12.4299 18.64 12.9399 18.93L17.8199 21.64C19.3999 22.52 20.6899 21.76 20.6899 19.95V5.86C20.6799 3.74 18.9499 2 16.8199 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;

  // Local storage bookmarks
  let savedPosts = new Set();
  try {
    const stored = localStorage.getItem('radiology_saved_protocols');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        savedPosts = new Set(parsed);
      }
    }
  } catch (err) {
    savedPosts = new Set();
  }

  /**
   * Helper: Format ISO date string (YYYY-MM-DD) into readable format
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      if (!year || !month || !day) return dateStr;
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const mIdx = parseInt(month, 10) - 1;
      return `${months[mIdx] || month} ${parseInt(day, 10)}, ${year}`;
    } catch {
      return dateStr;
    }
  }

  /**
   * 1. Dynamic Pinned Post Rendering
   * Finds the post marked pinned: true (or falls back to first post)
   */
  function renderPinnedPost() {
    const pinnedPost = POSTS.find((p) => p.pinned === true) || POSTS[0];
    if (!pinnedPost) return;

    const dateElem = document.getElementById('pinned-meta-date');
    const timeElem = document.getElementById('pinned-meta-time');
    const titleLink = document.getElementById('pinned-title-link');
    const descElem = document.getElementById('pinned-post-desc');
    const highlightsContainer = document.getElementById('pinned-highlights');
    const readBtn = document.getElementById('pinned-read-btn');

    if (dateElem) {
      dateElem.textContent = formatDate(pinnedPost.publishedAt);
    }
    if (timeElem) {
      const clockSvg = `
        <svg class="pinned-meta-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <g clip-path="url(#clip0_clock_icon)">
            <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M15.71 15.1798L12.61 13.3298C12.07 13.0098 11.63 12.2398 11.63 11.6098V7.50977" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </g>
          <defs>
            <clipPath id="clip0_clock_icon">
              <rect width="24" height="24" fill="white"/>
            </clipPath>
          </defs>
        </svg>
        <span>${pinnedPost.readTime || '7 min read'}</span>
      `;
      timeElem.innerHTML = clockSvg;
    }
    if (titleLink) {
      titleLink.textContent = pinnedPost.title;
      titleLink.setAttribute('href', pinnedPost.url);
    }
    if (descElem) {
      descElem.textContent = pinnedPost.description;
    }
    if (readBtn) {
      readBtn.setAttribute('href', pinnedPost.url);
    }

    if (highlightsContainer && Array.isArray(pinnedPost.tags) && pinnedPost.tags.length > 0) {
      highlightsContainer.innerHTML = pinnedPost.tags.slice(0, 3).map((tag, idx) => `
        <a href="#tag-${tag.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" class="pinned-highlight-item" id="pinned-highlight-${idx + 1}" data-tag="${tag}">
          <svg class="pinned-tag-hash-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M10 3L8 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M16 3L14 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3.5 9H21.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M2.5 15H20.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>${tag}</span>
        </a>
      `).join('');

      // Clicking any tag filters the blog grid
      highlightsContainer.querySelectorAll('.pinned-highlight-item').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const tag = el.getAttribute('data-tag');
          if (tag) filterByTerm(tag, `Tag: ${tag}`);
        });
      });
    }
  }

  /**
   * 2. Dynamic Popular Posts Sidebar Rendering
   * Sorts popular.enabled: true by popular.position (1 = hero card, 2..5 = text rows)
   */
  function renderPopularPosts() {
    const popularPosts = POSTS
      .filter((p) => p.popular && p.popular.enabled)
      .sort((a, b) => (a.popular.position || 99) - (b.popular.position || 99));

    if (!popularPosts.length) return;

    const featuredContainer = document.querySelector('.popular-featured-post');
    const textListContainer = document.querySelector('.popular-text-list');

    // Post 1: Hero-style Card with Image Overlayed by Text
    const post1 = popularPosts.find((p) => p.popular.position === 1) || popularPosts[0];
    if (featuredContainer && post1) {
      featuredContainer.innerHTML = `
        <a href="${post1.url}" class="popular-overlay-card" aria-label="Popular Post # 1: ${post1.title}">
          <img
            src="${post1.thumbnail}"
            alt="${post1.alt || post1.title}"
            class="popular-overlay-img"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div class="popular-overlay-scrim" aria-hidden="true"></div>
          
          <div class="popular-overlay-body">
            <div class="popular-overlay-top">
              <span class="popular-rank-pill rank-top">
                <svg class="popular-rank-hash-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M10 3L8 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M16 3L14 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M3.5 9H21.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M2.5 15H20.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>1</span>
              </span>
              <span class="popular-overlay-tag">
                <svg class="popular-tag-hash-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M10 3L8 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M16 3L14 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M3.5 9H21.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M2.5 15H20.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                ${post1.Topic}
              </span>
            </div>
            <h4 class="popular-overlay-title">${post1.title}</h4>
            <p class="popular-overlay-desc">${post1.description}</p>
            <div class="popular-overlay-meta">
              <span>${post1.readTime || '5 min read'}</span>
              <span class="meta-dot" aria-hidden="true">•</span>
              <span>${formatDate(post1.publishedAt)}</span>
            </div>
          </div>
        </a>
      `;
    }

    // Posts 2 through 5: Ranked text list items
    const remainingPosts = popularPosts.filter((p) => p !== post1).slice(0, 4);
    if (textListContainer && remainingPosts.length > 0) {
      textListContainer.innerHTML = remainingPosts
        .map((post, idx) => {
          const rankNum = post.popular.position || (idx + 2);
          return `
          <article class="popular-text-item">
            <a href="${post.url}" class="popular-text-link" aria-label="Popular Post # ${rankNum}: ${post.title}">
              <span class="popular-rank-pill">
                <svg class="popular-rank-hash-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M10 3L8 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M16 3L14 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M3.5 9H21.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M2.5 15H20.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>${rankNum}</span>
              </span>
              <div class="popular-text-content">
                <h4 class="popular-text-title">${post.title}</h4>
                <div class="popular-meta-row">
                  <span class="popular-meta-tag">${post.Topic}</span>
                  <span class="popular-meta-dot" aria-hidden="true">•</span>
                  <span class="popular-meta-time">${post.readTime || '4 min read'}</span>
                </div>
              </div>
            </a>
          </article>
        `;
        })
        .join('');
    }
  }

  /**
   * 3. Topic Counts Dynamic Stimulation
   * Computes article count per topic and updates the sidebar chips
   */
  function updateTopicCounts() {
    const topicCounts = {};
    const uniqueTopics = new Set();

    POSTS.forEach((p) => {
      const top = (p.Topic || '').trim();
      if (top) {
        uniqueTopics.add(top);
        const key = top.toLowerCase();
        topicCounts[key] = (topicCounts[key] || 0) + 1;
      }
      if (Array.isArray(p.tags)) {
        p.tags.forEach((tag) => {
          const tKey = tag.toLowerCase();
          topicCounts[tKey] = (topicCounts[tKey] || 0) + 1;
        });
      }
    });

    // Update count badge
    const badge = document.getElementById('topics-count-badge');
    if (badge) {
      badge.textContent = `${uniqueTopics.size} Categories`;
    }

    // Mapping between data-topic attributes and topic keywords
    const topicMap = {
      'neuroradiology': ['neuroradiology', 'neuro', 'brain', 'spine'],
      'chest-ct': ['chest ct', 'chest', 'hrct', 'thoracic', 'pulmonary'],
      'musculoskeletal': ['musculoskeletal', 'msk', 'gout', 'rotator'],
      'nuclear-medicine': ['nuclear medicine', 'nuclear med', 'pet-ct', 'oncology'],
      'interventional': ['interventional', 'intervention', 'fluoroscopy', 'angiography'],
      'pediatric': ['pediatrics', 'pediatric', 'neonatal'],
      'radiation-safety': ['safety / qa', 'radiation safety', 'alara', 'physics'],
      'gastrointestinal': ['abdominal', 'abdomen', 'liver', 'hepatobiliary', 'gastrointestinal'],
      'cardiac-mri': ['cardiac mri', 'cardiology', 'heart'],
      'emergency': ['emergency', 'trauma'],
      'head-neck': ['head & neck', 'head neck'],
      'ultrasound': ['ultrasound', 'neurosonography']
    };

    document.querySelectorAll('.topic-item').forEach((item) => {
      const dataTopic = item.getAttribute('data-topic');
      const countSpan = item.querySelector('.topic-count');
      if (!dataTopic || !countSpan) return;

      const synonyms = topicMap[dataTopic] || [dataTopic];
      let matchCount = 0;

      // Count posts matching any of the synonyms in Topic or tags
      POSTS.forEach((post) => {
        const postTopic = (post.Topic || '').toLowerCase();
        const postTags = (post.tags || []).map((t) => t.toLowerCase());
        const hasMatch = synonyms.some(
          (syn) => postTopic.includes(syn) || postTags.some((tag) => tag.includes(syn))
        );
        if (hasMatch) matchCount++;
      });

      // Stimulate count with formatted double-digit string
      const displayCount = String(matchCount).padStart(2, '0');
      countSpan.textContent = `(${displayCount})`;

      // Attach click to filter blog grid by this topic
      item.onclick = (e) => {
        e.preventDefault();
        const nameSpan = item.querySelector('.topic-name');
        const topicName = nameSpan ? nameSpan.textContent.trim() : dataTopic;
        filterByTopic(synonyms, topicName);
      };
    });
  }

  /**
   * Filter posts by a topic synonym list
   */
  function filterByTopic(synonyms, displayLabel) {
    activePosts = POSTS.filter((post) => {
      const postTopic = (post.Topic || '').toLowerCase();
      const postTags = (post.tags || []).map((t) => t.toLowerCase());
      return synonyms.some(
        (syn) => postTopic.includes(syn) || postTags.some((tag) => tag.includes(syn))
      );
    });

    activeFilterLabel = `Topic: "${displayLabel}"`;
    currentPage = 1;
    updateFilterUI();
    renderBlogGrid();
    scrollToBlog();
  }

  /**
   * Filter posts by generic search term
   */
  function filterByTerm(term, displayLabel) {
    const q = term.toLowerCase().trim();
    if (!q) {
      clearFilter();
      return;
    }

    activePosts = POSTS.filter((post) => {
      const inTitle = (post.title || '').toLowerCase().includes(q);
      const inDesc = (post.description || '').toLowerCase().includes(q);
      const inTopic = (post.Topic || '').toLowerCase().includes(q);
      const inTags = (post.tags || []).some((t) => t.toLowerCase().includes(q));
      const inKeywords = (post.search?.keywords || []).some((k) => k.toLowerCase().includes(q));
      return inTitle || inDesc || inTopic || inTags || inKeywords;
    });

    activeFilterLabel = displayLabel || `Search: "${term}"`;
    currentPage = 1;
    updateFilterUI();
    renderBlogGrid();
    scrollToBlog();
  }

  /**
   * Clear active filter and restore all posts
   */
  function clearFilter() {
    activePosts = [...POSTS];
    activeFilterLabel = null;
    currentPage = 1;
    updateFilterUI();
    renderBlogGrid();
  }

  function updateFilterUI() {
    const indicator = document.getElementById('blog-filter-indicator');
    const filterText = document.getElementById('blog-filter-text');
    const countBadge = document.getElementById('blog-count-badge');

    if (countBadge) {
      countBadge.textContent = `${activePosts.length} Articles`;
    }

    if (indicator && filterText) {
      if (activeFilterLabel) {
        indicator.style.display = 'inline-flex';
        filterText.innerHTML = `Filtered by: <strong>${activeFilterLabel}</strong> (${activePosts.length} found)`;
      } else {
        indicator.style.display = 'none';
      }
    }
  }

  function scrollToBlog() {
    const section = document.getElementById('blog-section');
    if (section) {
      const rect = section.getBoundingClientRect();
      window.scrollTo({
        top: window.pageYOffset + rect.top - 70,
        behavior: 'smooth'
      });
    }
  }

  /**
   * 4. Blog Grid Rendering & Real Image Shimmer Loader
   */
  function renderBlogGrid() {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    currentPaginationToken++;
    const sessionToken = currentPaginationToken;

    const totalPages = Math.max(1, Math.ceil(activePosts.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = 1;

    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const items = activePosts.slice(startIdx, endIdx);

    if (items.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px 16px; text-align: center; color: var(--color-text-tertiary);">
          <p style="font-size: 15px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 8px;">No matching clinical articles found</p>
          <p style="font-size: 13px; margin-bottom: 16px;">Try adjusting your search terms or browse by topic.</p>
          <button type="button" class="search-action-btn" id="empty-state-reset-btn" style="padding: 6px 14px; font-size: 12px; margin: 0 auto;">
            Reset All Articles
          </button>
        </div>
      `;
      const resetBtn = document.getElementById('empty-state-reset-btn');
      if (resetBtn) resetBtn.onclick = clearFilter;
      renderPagination(0);
      return;
    }

    grid.innerHTML = items
      .map((item) => {
        const isSaved = savedPosts.has(item.id);
        const iconSvg = isSaved ? SVG_BOOKMARK_MINUS : SVG_BOOKMARK_PLUS;
        const formattedDate = formatDate(item.publishedAt);
        const relatedCount = Array.isArray(item.related) ? item.related.length : 0;
        const primaryTag = Array.isArray(item.tags) && item.tags.length > 0 ? item.tags[0] : item.Topic;

        return `
        <article class="blog-card" id="${item.id}" data-slug="${item.slug}">
          <div class="blog-card-media is-loading" aria-label="${item.title}">
            <!-- Image skeleton shimmer placeholder -->
            <div class="blog-card-skeleton" aria-hidden="true">
              <div class="blog-skeleton-shimmer"></div>
              <div class="blog-skeleton-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
              </div>
            </div>

            <!-- Real Article Thumbnail -->
            <img
              src="${item.thumbnail}"
              alt="${item.alt || item.title}"
              class="blog-card-img"
              loading="lazy"
              referrerPolicy="no-referrer"
              decoding="async"
            />

            <!-- Error fallback -->
            <div class="blog-card-img-fallback" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span class="blog-fallback-text">Image unavailable</span>
            </div>

            <!-- Copy Direct Image URL Action -->
            <button
              type="button"
              class="blog-card-img-copy-btn"
              data-img-url="${item.thumbnail}"
              title="Copy direct image link"
              aria-label="Copy direct image link for ${item.title}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span class="img-btn-label">Image</span>
            </button>

            <!-- Save Protocol Button -->
            <button
              type="button"
              class="blog-card-save-btn ${isSaved ? 'is-saved' : ''}"
              aria-label="${isSaved ? 'Remove saved protocol' : 'Save protocol'}"
              data-post-id="${item.id}"
              title="${isSaved ? 'Saved' : 'Save'}"
            >
              <span class="blog-card-save-text">${isSaved ? 'Saved' : 'Save'}</span>
              <span class="blog-card-save-icon">
                ${iconSvg}
              </span>
            </button>
          </div>

          <div class="blog-card-body">
            <div class="blog-card-meta">
              <span class="blog-card-in">in</span>
              <span class="blog-card-labels">${item.Topic}</span>
              ${relatedCount > 0 ? `<span class="blog-card-related-badge" title="Has ${relatedCount} related clinical protocols">${relatedCount} Related</span>` : ''}
            </div>

            <a href="${item.url}" class="blog-card-title-link">
              <h4 class="blog-card-title">${item.title}</h4>
            </a>

            <p class="blog-card-excerpt">${item.description}</p>
          </div>

          <div class="blog-card-footer">
            <span class="blog-card-date">${formattedDate}</span>
            <a href="${item.url}" class="blog-card-read-label" aria-label="Read Protocol: ${item.title}">
              <span>Read Protocol</span>
              <svg class="blog-card-chevron" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8.9502 4.08008L15.4702 10.6001C16.2402 11.3701 16.2402 12.6301 15.4702 13.4001L8.9502 19.9201" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>
          </div>
        </article>
      `;
      })
      .join('');

    attachSaveListeners();
    attachImageCopyListeners();
    setupCardImageLoaders(sessionToken);
    renderPagination(totalPages);
  }

  /**
   * Clipboard helper to copy image links
   */
  function attachImageCopyListeners() {
    document.querySelectorAll('.blog-card-img-copy-btn').forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = btn.getAttribute('data-img-url');
        if (!url) return;

        navigator.clipboard.writeText(url).then(() => {
          const label = btn.querySelector('.img-btn-label');
          btn.classList.add('is-copied');
          if (label) label.textContent = 'Copied!';
          setTimeout(() => {
            btn.classList.remove('is-copied');
            if (label) label.textContent = 'Image';
          }, 2000);
        }).catch(() => {
          // Fallback
          window.open(url, '_blank', 'noopener,noreferrer');
        });
      };
    });
  }

  function setupCardImageLoaders(pageSessionToken) {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.blog-card');
    cards.forEach((card) => {
      const media = card.querySelector('.blog-card-media');
      const img = card.querySelector('.blog-card-img');
      const skeleton = card.querySelector('.blog-card-skeleton');
      const fallback = card.querySelector('.blog-card-img-fallback');

      if (!media || !img) return;

      let handled = false;

      function onLoaded() {
        if (handled) return;
        handled = true;
        if (pageSessionToken !== currentPaginationToken) return;

        media.classList.remove('is-loading');
        media.classList.add('is-loaded');
      }

      function onError() {
        if (handled) return;
        handled = true;
        if (pageSessionToken !== currentPaginationToken) return;

        media.classList.remove('is-loading');
        media.classList.add('is-error');
        if (skeleton) skeleton.style.display = 'none';
        if (fallback) fallback.style.display = 'flex';
      }

      if (img.complete) {
        if (img.naturalWidth > 0) {
          onLoaded();
        } else {
          onError();
        }
      } else {
        img.addEventListener('load', onLoaded, { once: true });
        img.addEventListener('error', onError, { once: true });
      }
    });
  }

  function handleSaveToggle(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn = e.currentTarget;
    const postId = btn.getAttribute('data-post-id');
    if (!postId) return;

    const labelSpan = btn.querySelector('.blog-card-save-text');
    const iconSpan = btn.querySelector('.blog-card-save-icon');

    if (savedPosts.has(postId)) {
      savedPosts.delete(postId);
      btn.classList.remove('is-saved');
      btn.setAttribute('aria-label', 'Save protocol');
      btn.setAttribute('title', 'Save');
      if (labelSpan) labelSpan.textContent = 'Save';
      if (iconSpan) iconSpan.innerHTML = SVG_BOOKMARK_PLUS;
    } else {
      savedPosts.add(postId);
      btn.classList.add('is-saved');
      btn.setAttribute('aria-label', 'Remove saved protocol');
      btn.setAttribute('title', 'Saved');
      if (labelSpan) labelSpan.textContent = 'Saved';
      if (iconSpan) iconSpan.innerHTML = SVG_BOOKMARK_MINUS;
    }

    try {
      localStorage.setItem('radiology_saved_protocols', JSON.stringify([...savedPosts]));
    } catch (err) {
      // Ignore
    }
  }

  function attachSaveListeners() {
    const saveBtns = document.querySelectorAll('.blog-card-save-btn');
    saveBtns.forEach((btn) => {
      btn.removeEventListener('click', handleSaveToggle);
      btn.addEventListener('click', handleSaveToggle);
    });
  }

  function goToPage(pageNum, totalPages) {
    if (pageNum < 1 || pageNum > totalPages || pageNum === currentPage) return;
    currentPage = pageNum;
    renderBlogGrid();
    scrollToBlog();
  }

  function renderPagination(totalPages) {
    const homeBtn = document.getElementById('pagination-home-btn');
    const prevBtn = document.getElementById('pagination-prev-btn');
    const nextBtn = document.getElementById('pagination-next-btn');
    const numbersContainer = document.getElementById('pagination-numbers');

    if (homeBtn) {
      homeBtn.disabled = currentPage === 1;
      homeBtn.setAttribute('aria-disabled', String(currentPage === 1));
      homeBtn.onclick = () => goToPage(1, totalPages);
    }

    if (prevBtn) {
      prevBtn.disabled = currentPage === 1;
      prevBtn.setAttribute('aria-disabled', String(currentPage === 1));
      prevBtn.onclick = () => goToPage(currentPage - 1, totalPages);
    }

    if (nextBtn) {
      nextBtn.disabled = currentPage >= totalPages;
      nextBtn.setAttribute('aria-disabled', String(currentPage >= totalPages));
      nextBtn.onclick = () => goToPage(currentPage + 1, totalPages);
    }

    if (!numbersContainer) return;

    if (totalPages <= 1) {
      numbersContainer.innerHTML = `
        <button type="button" class="pagination-number is-active" data-page="1" aria-current="page">1</button>
      `;
      return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
      const isActive = i === currentPage;
      html += `
        <button
          type="button"
          class="pagination-number ${isActive ? 'is-active' : ''}"
          data-page="${i}"
          aria-current="${isActive ? 'page' : 'false'}"
          aria-label="Go to page ${i}"
        >
          ${i}
        </button>
      `;
    }

    numbersContainer.innerHTML = html;

    numbersContainer.querySelectorAll('.pagination-number').forEach((btn) => {
      btn.addEventListener('click', function () {
        const page = parseInt(this.getAttribute('data-page'), 10);
        if (page && page !== currentPage) {
          goToPage(page, totalPages);
        }
      });
    });
  }

  /**
   * 5. Multi-field Real-Time Search Engine
   * Matches title, description, Topic, tags, and search.keywords
   */
  function initSearchEngine() {
    const searchInput = document.getElementById('search-input');
    const searchForm = document.getElementById('search-form');
    const searchResults = document.getElementById('search-modal-results');
    const clearBtn = document.getElementById('search-clear-btn');
    const modalOverlay = document.getElementById('search-modal-overlay');

    if (!searchInput || !searchResults) return;

    function highlightText(text, query) {
      if (!query || !text) return text;
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    function renderDefaultSearchState() {
      searchResults.innerHTML = `
        <div class="search-empty-state">
          <p class="search-empty-title">Suggested Clinical Topics</p>
          <div class="search-empty-tags">
            <button type="button" class="search-suggested-tag" data-tag="Neuroradiology">Neuroradiology</button>
            <button type="button" class="search-suggested-tag" data-tag="CT">Computed Tomography</button>
            <button type="button" class="search-suggested-tag" data-tag="MRI">Magnetic Resonance</button>
            <button type="button" class="search-suggested-tag" data-tag="Emergency">Emergency Trauma</button>
            <button type="button" class="search-suggested-tag" data-tag="Ultrasound">Ultrasound</button>
            <button type="button" class="search-suggested-tag" data-tag="Intervention">Intervention</button>
          </div>
        </div>
      `;

      searchResults.querySelectorAll('.search-suggested-tag').forEach((btn) => {
        btn.onclick = () => {
          const tag = btn.getAttribute('data-tag');
          if (tag) {
            searchInput.value = tag;
            performSearch(tag);
          }
        };
      });
    }

    function performSearch(query) {
      const q = query.trim().toLowerCase();
      if (!q) {
        renderDefaultSearchState();
        return;
      }

      // Multi-field scoring
      const matches = POSTS.map((post) => {
        let score = 0;
        const titleLower = (post.title || '').toLowerCase();
        const descLower = (post.description || '').toLowerCase();
        const topicLower = (post.Topic || '').toLowerCase();
        const tags = (post.tags || []).map((t) => t.toLowerCase());
        const keywords = (post.search?.keywords || []).map((k) => k.toLowerCase());

        if (titleLower.includes(q)) score += 10;
        if (topicLower.includes(q)) score += 8;
        if (keywords.some((k) => k.includes(q))) score += 7;
        if (tags.some((t) => t.includes(q))) score += 6;
        if (descLower.includes(q)) score += 4;

        return { post, score };
      })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.post);

      if (matches.length === 0) {
        searchResults.innerHTML = `
          <div class="search-empty-state">
            <p class="search-empty-title">No notes or protocols found for "${query}"</p>
            <p style="font-size: 12px; margin: 0;">Try synonyms like "CT", "MRI", "Stroke", "Trauma", or "LGE"</p>
          </div>
        `;
        return;
      }

      searchResults.innerHTML = `
        <div class="search-results-summary">
          <span>Found ${matches.length} articles</span>
          <span style="font-size: 10.5px; opacity: 0.8;">Press Enter to filter grid</span>
        </div>
        ${matches.map((post) => `
          <div class="search-result-item" data-id="${post.id}" data-url="${post.url}" tabindex="0" role="button">
            <img src="${post.thumbnail}" alt="${post.title}" class="search-result-thumb" loading="lazy" />
            <div class="search-result-content">
              <div class="search-result-top">
                <span class="search-result-topic">${post.Topic}</span>
                ${post.pinned ? `<span class="search-result-pinned-tag">Pinned</span>` : ''}
                <span class="search-result-time">• ${post.readTime || '5 min read'}</span>
              </div>
              <h4 class="search-result-title">${highlightText(post.title, query)}</h4>
              <p class="search-result-desc">${highlightText(post.description, query)}</p>
              <div class="search-result-actions">
                <button type="button" class="search-action-btn search-filter-now-btn" data-id="${post.id}">
                  Filter In Grid
                </button>
                <button type="button" class="search-action-btn search-copy-img-btn" data-img="${post.thumbnail}">
                  Copy Image Link
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      `;

      // Click result to filter
      searchResults.querySelectorAll('.search-result-item').forEach((item) => {
        item.addEventListener('click', (e) => {
          // If clicked the copy button, don't close
          if (e.target.closest('.search-copy-img-btn')) return;
          const postId = item.getAttribute('data-id');
          const matchedPost = POSTS.find((p) => p.id === postId);
          if (matchedPost) {
            filterByTerm(matchedPost.title, matchedPost.title);
            closeSearchModal();
          }
        });
      });

      // Copy image button inside search modal
      searchResults.querySelectorAll('.search-copy-img-btn').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const imgUrl = btn.getAttribute('data-img');
          if (imgUrl) {
            navigator.clipboard.writeText(imgUrl).then(() => {
              btn.textContent = 'Copied!';
              setTimeout(() => {
                btn.textContent = 'Copy Image Link';
              }, 1800);
            });
          }
        };
      });
    }

    function closeSearchModal() {
      if (modalOverlay) {
        modalOverlay.classList.remove('is-active');
        modalOverlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
      }
    }

    searchInput.addEventListener('input', (e) => {
      performSearch(e.target.value);
    });

    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
          filterByTerm(query, `Query: "${query}"`);
          closeSearchModal();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        renderDefaultSearchState();
      });
    }

    // Initial default state
    renderDefaultSearchState();
  }

  /**
   * Initialize Everything
   */
  function initBlog() {
    renderPinnedPost();
    renderPopularPosts();
    updateTopicCounts();
    renderBlogGrid();
    initSearchEngine();

    // Active filter clear button
    const clearFilterBtn = document.getElementById('blog-filter-clear-btn');
    if (clearFilterBtn) {
      clearFilterBtn.addEventListener('click', clearFilter);
    }

    // Expose global methods for external header / drawer integration
    window.radiologySearch = filterByTerm;
    window.radiologyFilterByTopic = filterByTopic;
    window.radiologyClearFilter = clearFilter;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlog);
  } else {
    initBlog();
  }
})();
