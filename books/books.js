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
  let viewTableBtn;
  let viewGridBtn;

  function initDOMElements() {
    booksContainer = document.getElementById('books-content-area');
    searchInput = document.getElementById('books-search-input');
    searchClearBtn = document.getElementById('books-search-clear');
    sortSelect = document.getElementById('books-sort-select');
    viewTableBtn = document.getElementById('view-table-btn');
    viewGridBtn = document.getElementById('view-grid-btn');
  }

  function start() {
    initDOMElements();
    initEvents();
    loadBooks();
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

    // Sort selector
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

    // Custom local event for same-tab updates
    window.addEventListener('radiology_books_updated', () => {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          booksData = JSON.parse(cached);
          parsedBooks = processBooksData(booksData);
          applyFilterAndRender();
        } catch (err) {
          console.error(err);
        }
      }
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
    btn.setAttribute('aria-label', `Downloading ${bookTitle}...`);
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

    // 5. Restore Button State
    btn.classList.remove('is-loading');
    btn.removeAttribute('aria-busy');
    btn.setAttribute('aria-label', `Download ${bookTitle}`);
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

    if (viewMode === 'table') {
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
              <th scope="col" class="th-book-download">Download</th>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity: 0.7;">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
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
                ? `<button type="button" class="book-download-btn" data-download-url="${escapeHtml(b.downloadLink)}" data-book-title="${escapeHtml(b.title)}" title="Download ${escapeHtml(b.title)}" aria-label="Download ${escapeHtml(b.title)}">
                    ${DOWNLOAD_ICON_SVG}
                  </button>`
                : `<span class="book-no-download" title="No download link available">--</span>`
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
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 3px; opacity: 0.7;">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
            ${escapeHtml(b.size)}
          </span>

          <div class="book-action-group">
            ${
              b.downloadLink
                ? `<button type="button" class="book-download-btn" data-download-url="${escapeHtml(b.downloadLink)}" data-book-title="${escapeHtml(b.title)}" title="Download ${escapeHtml(b.title)}" aria-label="Download ${escapeHtml(b.title)}">
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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <h2 class="books-empty-title">No books found</h2>
        <p class="books-empty-desc">
          Try clearing your search query to browse all available books.
        </p>
        <button type="button" class="books-empty-reset-btn" id="books-filter-reset-btn">
          Clear Search
        </button>
      </div>
    `;

    const resetBtn = document.getElementById('books-filter-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchQuery = '';
        if (searchClearBtn) searchClearBtn.classList.remove('is-visible');
        if (sortSelect) sortSelect.value = 'title-asc';
        sortBy = 'title-asc';
        applyFilterAndRender();
      });
    }
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
