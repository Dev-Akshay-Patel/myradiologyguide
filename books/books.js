/**
 * books.js
 * Best Books & Clinical Literature Controller
 * Direct catalog of high-yield radiology books.
 * Displays Book Title, Size, and Download (all left-aligned).
 * Icon-only Download button with SVG and animated background fetch loader.
 * Fully responsive for mobile devices.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'radiology_books_data';

  const DOWNLOAD_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
<path d="M16.44 8.90039C20.04 9.21039 21.51 11.0604 21.51 15.1104V15.2404C21.51 19.7104 19.72 21.5004 15.25 21.5004H8.73998C4.26998 21.5004 2.47998 19.7104 2.47998 15.2404V15.1104C2.47998 11.0904 3.92998 9.24039 7.46998 8.91039" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
<path d="M12 2V14.88" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
<path d="M15.3499 12.6504L11.9999 16.0004L8.6499 12.6504" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

  const LOADER_SVG = `<svg class="container" viewBox="0 0 40 40" height="40" width="40">
  <circle class="track" cx="20" cy="20" r="17.5" pathlength="100" stroke-width="5px" fill="none" />
  <circle class="car" cx="20" cy="20" r="17.5" pathlength="100" stroke-width="5px" fill="none" />
</svg>`;

  // State
  let booksData = [];
  let parsedBooks = [];
  let searchQuery = '';
  let sortBy = 'title-asc';
  let viewMode = localStorage.getItem('books-view-mode') || 'table';

  // DOM Elements
  let booksContainer;
  let searchInput;
  let searchClearBtn;
  let sortSelect;
  let sortDropdown;
  let sortTrigger;
  let sortMenu;
  let sortSelectedText;
  let viewTableBtn;
  let viewGridBtn;

  function initDOMElements() {
    booksContainer = document.getElementById('books-content-area');
    searchInput = document.getElementById('books-search-input');
    searchClearBtn = document.getElementById('books-search-clear');
    sortSelect = document.getElementById('books-sort-select');
    sortDropdown = document.getElementById('books-sort-dropdown');
    sortTrigger = document.getElementById('books-sort-trigger');
    sortMenu = document.getElementById('books-sort-menu');
    sortSelectedText = document.getElementById('books-sort-selected-text');
    viewTableBtn = document.getElementById('view-table-btn');
    viewGridBtn = document.getElementById('view-grid-btn');
  }

  function start() {
    initDOMElements();
    initEvents();
    initTopicsShowMore();
    loadBooks();
  }

  function initTopicsShowMore() {
    const toggleBtn = document.getElementById('topics-toggle-btn');
    const wrapper = document.getElementById('topics-expandable-wrapper');
    if (!toggleBtn || !wrapper) return;

    const toggleText = toggleBtn.querySelector('.topics-toggle-text');
    const hiddenItems = Array.from(wrapper.querySelectorAll('.topic-item'));
    const hiddenCount = hiddenItems.length;

    hiddenItems.forEach((item) => {
      item.setAttribute('tabindex', '-1');
    });

    const moreText = `Show More (+${hiddenCount})`;
    const lessText = 'Show Less';

    if (toggleText) {
      toggleText.textContent = moreText;
    }

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      const willExpand = !isExpanded;

      toggleBtn.setAttribute('aria-expanded', String(willExpand));
      wrapper.setAttribute('aria-hidden', String(!willExpand));

      if (willExpand) {
        wrapper.classList.add('is-expanded');
        if (toggleText) {
          toggleText.textContent = lessText;
        }
        hiddenItems.forEach((item) => {
          item.removeAttribute('tabindex');
        });
      } else {
        wrapper.classList.remove('is-expanded');
        if (toggleText) {
          toggleText.textContent = moreText;
        }
        hiddenItems.forEach((item) => {
          item.setAttribute('tabindex', '-1');
        });
      }

      if (e.detail > 0) {
        toggleBtn.blur();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  /* --------------------------------------------------------------------------
     1. Size Helper & Data Sanitizer
     -------------------------------------------------------------------------- */
  function parseSizeBytes(sizeStr) {
    if (!sizeStr) return 0;
    const str = String(sizeStr).trim().toUpperCase();
    const match = str.match(/^([\d.]+)\s*([A-Z]+)?$/);
    if (!match) return 0;
    const val = parseFloat(match[1]) || 0;
    const unit = match[2] || 'MB';
    if (unit === 'GB') return val * 1024 * 1024 * 1024;
    if (unit === 'MB') return val * 1024 * 1024;
    if (unit === 'KB') return val * 1024;
    if (unit === 'B') return val;
    return val * 1024 * 1024;
  }

  function cleanTitle(rawTitle) {
    if (!rawTitle) return 'Untitled Book';
    // Remove standalone format tokens like [PDF], (EPUB), - PDF, .pdf, etc.
    let title = String(rawTitle).trim();
    title = title.replace(/\[\s*(pdf|epub)\s*\]/gi, '');
    title = title.replace(/\(\s*(pdf|epub)\s*\)/gi, '');
    title = title.replace(/\b(pdf|epub)\b$/gi, '');
    title = title.replace(/\s+-\s+(pdf|epub)\s*$/gi, '');
    return title.trim() || rawTitle;
  }

  function processBooksData(rawList) {
    if (!Array.isArray(rawList)) return [];

    return rawList.map((b, idx) => {
      const directDownload = b.downloadLink || b.link || '';
      return {
        id: b.id || 'book-' + (idx + 1),
        title: cleanTitle(b.title),
        rawTitle: b.title || 'Untitled Book',
        size: b.size || '--',
        sizeBytes: parseSizeBytes(b.size),
        downloadLink: directDownload
      };
    });
  }

  /* --------------------------------------------------------------------------
     2. Data Loader
     -------------------------------------------------------------------------- */
  async function loadBooks() {
    renderLoadingShimmer();
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            booksData = parsed;
            parsedBooks = processBooksData(booksData);
            applyFilterAndRender();
            return;
          }
        } catch (e) {
          console.warn('Failed to parse cached books, fetching default json', e);
        }
      }

      // Fetch from /data/books.json
      const res = await fetch('/data/books.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      booksData = Array.isArray(data) ? data : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(booksData));
      parsedBooks = processBooksData(booksData);
      applyFilterAndRender();
    } catch (err) {
      console.error('Error loading books:', err);
      renderErrorState(err.message);
    }
  }

  /* --------------------------------------------------------------------------
     3. Event Handlers
     -------------------------------------------------------------------------- */
  function initEvents() {
    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        if (searchClearBtn) {
          searchClearBtn.classList.toggle('is-visible', searchQuery.length > 0);
        }
        applyFilterAndRender();
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchQuery = '';
          searchClearBtn.classList.remove('is-visible');
          searchInput.focus();
        }
        applyFilterAndRender();
      });
    }

    // Custom Sort Dropdown Handler
    if (sortTrigger && sortMenu) {
      const sortOptions = sortMenu.querySelectorAll('.books-sort-option');

      function closeSortMenu() {
        sortMenu.classList.remove('is-open');
        sortTrigger.setAttribute('aria-expanded', 'false');
      }

      function openSortMenu() {
        sortMenu.classList.add('is-open');
        sortTrigger.setAttribute('aria-expanded', 'true');
        const activeOpt = sortMenu.querySelector('.books-sort-option.is-active');
        if (activeOpt) activeOpt.focus();
      }

      sortTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = sortMenu.classList.contains('is-open');
        if (isOpen) {
          closeSortMenu();
        } else {
          openSortMenu();
        }
      });

      sortOptions.forEach((option) => {
        const selectOption = () => {
          const val = option.getAttribute('data-value');
          if (!val) return;
          sortBy = val;

          sortOptions.forEach((opt) => {
            const isMatch = opt.getAttribute('data-value') === val;
            opt.classList.toggle('is-active', isMatch);
            opt.setAttribute('aria-selected', isMatch ? 'true' : 'false');
          });

          const labelSpan = option.querySelector('.sort-option-label') || option.querySelector('span');
          if (labelSpan && sortSelectedText) {
            sortSelectedText.innerHTML = labelSpan.innerHTML.trim();
          }

          if (sortSelect) {
            sortSelect.value = val;
          }

          closeSortMenu();
          sortTrigger.focus();
          applyFilterAndRender();
        };

        option.addEventListener('click', (e) => {
          e.stopPropagation();
          selectOption();
        });

        option.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectOption();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = option.nextElementSibling;
            if (next && next.classList.contains('books-sort-option')) next.focus();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = option.previousElementSibling;
            if (prev && prev.classList.contains('books-sort-option')) prev.focus();
          } else if (e.key === 'Escape') {
            closeSortMenu();
            sortTrigger.focus();
          }
        });
      });

      // Close on click outside
      document.addEventListener('click', (e) => {
        if (sortDropdown && !sortDropdown.contains(e.target)) {
          closeSortMenu();
        }
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sortMenu.classList.contains('is-open')) {
          closeSortMenu();
          sortTrigger.focus();
        }
      });
    }

    // Sort selector fallback
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        applyFilterAndRender();
      });
    }

    // View toggles
    if (viewTableBtn) {
      viewTableBtn.addEventListener('click', () => {
        setViewMode('table');
      });
    }

    if (viewGridBtn) {
      viewGridBtn.addEventListener('click', () => {
        setViewMode('grid');
      });
    }

    // Event delegation for download buttons (both table and grid view)
    if (booksContainer) {
      booksContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.book-download-btn');
        if (!btn) return;
        e.preventDefault();
        handleDownloadWithLoader(btn);
      });
    }

    // Cross-tab and admin storage updates
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          booksData = JSON.parse(e.newValue);
          parsedBooks = processBooksData(booksData);
          applyFilterAndRender();
        } catch (err) {
          console.error(err);
        }
      }
    });

    // Handle viewport resize: ensure mobile view is consistently table view
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth <= 768 && viewMode === 'grid') {
          applyFilterAndRender();
        }
      }, 150);
    });
  }

  /* --------------------------------------------------------------------------
     4. Download Handler with Background Fetch & Loader
     -------------------------------------------------------------------------- */
  async function handleDownloadWithLoader(btn) {
    if (btn.classList.contains('is-loading')) return;

    const downloadUrl = btn.getAttribute('data-download-url');
    const bookTitle = btn.getAttribute('data-book-title') || 'radiology-book';

    if (!downloadUrl || downloadUrl === '#' || downloadUrl === '') {
      return;
    }

    // 1. Enter Loading State
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    btn.setAttribute('aria-label', `Saving ${bookTitle}...`);
    btn.innerHTML = LOADER_SVG;

    const minLoadTime = 1100; // minimum duration so user sees smooth spinner
    const startTime = Date.now();
    let blob = null;
    let filename = '';

    // 2. Fetch in background
    try {
      // Attempt background fetch
      const res = await fetch(downloadUrl, { method: 'GET' });
      if (res.ok) {
        blob = await res.blob();
        const disposition = res.headers.get('content-disposition');
        if (disposition && disposition.includes('filename=')) {
          const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
          if (match && match[1]) {
            filename = match[1].replace(/['"]/g, '');
          }
        }
      }
    } catch (fetchErr) {
      // Network/CORS fallback (common for external cloud storage URLs)
      console.warn('Direct CORS fetch prevented, fallback download used:', fetchErr);
    }

    // 3. Ensure spinner is displayed cleanly
    const elapsed = Date.now() - startTime;
    if (elapsed < minLoadTime) {
      await new Promise((resolve) => setTimeout(resolve, minLoadTime - elapsed));
    }

    // 4. Start file download
    if (!filename) {
      try {
        const urlObj = new URL(downloadUrl, window.location.href);
        const pathParts = urlObj.pathname.split('/');
        filename = pathParts[pathParts.length - 1] || '';
      } catch (e) {
        filename = '';
      }
      if (!filename || !filename.includes('.')) {
        filename = (bookTitle.replace(/[^a-zA-Z0-9_-]/g, '_') || 'radiology-book') + '.pdf';
      }
    }

    if (blob) {
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = filename;
      document.body.appendChild(tempLink);
      tempLink.click();
      setTimeout(() => {
        document.body.removeChild(tempLink);
        window.URL.revokeObjectURL(blobUrl);
      }, 800);
    } else {
      // Fallback anchor trigger for external or cross-origin URLs
      const tempLink = document.createElement('a');
      tempLink.href = downloadUrl;
      tempLink.target = '_blank';
      tempLink.rel = 'noopener noreferrer';
      tempLink.download = filename;
      document.body.appendChild(tempLink);
      tempLink.click();
      setTimeout(() => {
        document.body.removeChild(tempLink);
      }, 800);
    }

    // 5. Track download in User Downloads History
    try {
      const KEY = 'radiology_downloads_history_v1';
      let list = JSON.parse(localStorage.getItem(KEY) || '[]');
      list = list.filter(d => d.title !== bookTitle);
      list.unshift({
        id: 'dl-' + Date.now(),
        title: bookTitle,
        category: 'Reference Literature',
        format: 'PDF',
        size: btn.getAttribute('data-book-size') || '36 MB',
        timestamp: Date.now(),
        url: downloadUrl
      });
      localStorage.setItem(KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('downloads-updated', { detail: list }));
    } catch (e) {}

    // 6. Restore Button State
    btn.classList.remove('is-loading');
    btn.removeAttribute('aria-busy');
    btn.setAttribute('aria-label', `Save ${bookTitle}`);
    btn.innerHTML = DOWNLOAD_ICON_SVG;
  }

  function setViewMode(mode) {
    viewMode = mode;
    localStorage.setItem('books-view-mode', mode);
    if (viewTableBtn) viewTableBtn.classList.toggle('is-active', mode === 'table');
    if (viewGridBtn) viewGridBtn.classList.toggle('is-active', mode === 'grid');
    applyFilterAndRender();
  }

  /* --------------------------------------------------------------------------
     5. Filter & Sorting
     -------------------------------------------------------------------------- */
  function applyFilterAndRender() {
    let filtered = parsedBooks.slice();

    // Search query
    if (searchQuery) {
      filtered = filtered.filter((b) => {
        return (
          b.title.toLowerCase().includes(searchQuery) ||
          b.size.toLowerCase().includes(searchQuery)
        );
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
          return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        case 'title-desc':
          return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
        case 'size-desc':
          return b.sizeBytes - a.sizeBytes;
        case 'size-asc':
          return a.sizeBytes - b.sizeBytes;
        default:
          return a.title.localeCompare(b.title);
      }
    });

    renderBooks(filtered);
  }

  /* --------------------------------------------------------------------------
     6. Render Books (Table & Grid Views - All Left Aligned)
     -------------------------------------------------------------------------- */
  function renderBooks(books) {
    if (!booksContainer) return;

    if (books.length === 0) {
      renderEmptyState();
      return;
    }

    const isMobile = window.innerWidth <= 768;
    if (viewMode === 'table' || isMobile) {
      renderTableView(books);
    } else {
      renderGridView(books);
    }
  }

  function renderTableView(books) {
    const html = `
      <div class="books-table-wrapper" tabindex="0" role="region" aria-label="Books table list">
        <table class="books-table">
          <thead>
            <tr>
              <th scope="col" class="th-book-title">Book Title</th>
              <th scope="col" class="th-book-size">Size</th>
              <th scope="col" class="th-book-download">Save</th>
            </tr>
          </thead>
          <tbody>
            ${books.map((b) => renderTableRow(b)).join('')}
          </tbody>
        </table>
      </div>
    `;
    booksContainer.innerHTML = html;
  }

  function renderTableRow(b) {
    const downloadHref = b.downloadLink || '#';

    return `
      <tr>
        <td class="td-book-title">
          <div class="book-cell-title">
            <div class="book-title-meta">
              <a href="${escapeHtml(downloadHref)}" class="book-primary-title" data-download-url="${escapeHtml(b.downloadLink)}" data-book-title="${escapeHtml(b.title)}">
                ${escapeHtml(b.title)}
              </a>
              <span class="book-sub-size" aria-label="File size ${escapeHtml(b.size)}">
                ${escapeHtml(b.size)}
              </span>
            </div>
          </div>
        </td>
        <td class="td-book-size">
          <span class="book-size-badge">${escapeHtml(b.size)}</span>
        </td>
        <td class="td-book-download">
          <div class="book-action-group">
            ${
              b.downloadLink
                ? `<button type="button" class="book-download-btn" data-download-url="${escapeHtml(b.downloadLink)}" data-book-title="${escapeHtml(b.title)}" data-book-size="${escapeHtml(b.size)}" title="Save ${escapeHtml(b.title)}" aria-label="Save ${escapeHtml(b.title)}">
                    ${DOWNLOAD_ICON_SVG}
                  </button>`
                : `<span class="book-no-download" title="No link available">--</span>`
            }
          </div>
        </td>
      </tr>
    `;
  }

  function renderGridView(books) {
    const html = `
      <div class="books-cards-grid" role="list" aria-label="Books list cards">
        ${books.map((b) => renderCardItem(b)).join('')}
      </div>
    `;
    booksContainer.innerHTML = html;
  }

  function renderCardItem(b) {
    const downloadHref = b.downloadLink || '#';

    return `
      <div class="book-card-item" role="listitem">
        <div class="book-card-top">
          <div class="book-card-content">
            <h2 class="book-card-title">
              <a href="${escapeHtml(downloadHref)}" class="book-primary-title" data-download-url="${escapeHtml(b.downloadLink)}" data-book-title="${escapeHtml(b.title)}">
                ${escapeHtml(b.title)}
              </a>
            </h2>
          </div>
        </div>

        <div class="book-card-footer">
          <span class="book-size-badge" title="File Size">
            ${escapeHtml(b.size)}
          </span>

          <div class="book-action-group">
            ${
              b.downloadLink
                ? `<button type="button" class="book-download-btn" data-download-url="${escapeHtml(b.downloadLink)}" data-book-title="${escapeHtml(b.title)}" data-book-size="${escapeHtml(b.size)}" title="Save ${escapeHtml(b.title)}" aria-label="Save ${escapeHtml(b.title)}">
                    ${DOWNLOAD_ICON_SVG}
                  </button>`
                : ''
            }
          </div>
        </div>
      </div>
    `;
  }

  function renderEmptyState() {
    booksContainer.innerHTML = `
      <div class="books-empty-state">
        <div class="books-empty-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <g clip-path="url(#clip0_4418_9823)">
              <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M12 8V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M11.9945 16H12.0035" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </g>
            <defs>
              <clipPath id="clip0_4418_9823">
                <rect width="24" height="24" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        </div>
        <h2 class="books-empty-title">No books found</h2>
        <p class="books-empty-desc">
          Try adjusting your search query to browse available books.
        </p>
      </div>
    `;
  }

  function renderLoadingShimmer() {
    if (!booksContainer) return;
    booksContainer.innerHTML = `
      <div class="books-loading-shimmer" aria-label="Loading books library...">
        <div class="shimmer-card"></div>
        <div class="shimmer-card"></div>
        <div class="shimmer-card"></div>
        <div class="shimmer-card"></div>
        <div class="shimmer-card"></div>
        <div class="shimmer-card"></div>
      </div>
    `;
  }

  function renderErrorState(message) {
    if (!booksContainer) return;
    booksContainer.innerHTML = `
      <div class="books-empty-state">
        <h2 class="books-empty-title">Could not load book catalog</h2>
        <p class="books-empty-desc">${escapeHtml(message || 'Please check your connection and refresh the page.')}</p>
        <button type="button" class="books-empty-reset-btn" onclick="location.reload()">
          Refresh Page
        </button>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
