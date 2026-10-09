/**
 * books.js
 * Best Books & Clinical Literature Controller
 * Direct catalog of books provided by the user.
 * - All books folderized under their Author name.
 * - Folders start collapsed by default.
 * - In card grid view: NO numbers added.
 * - In table view: Clean numbered items.
 * - Zero CLS accordion architecture: targeted in-place DOM toggle that NEVER
 *   wipes out or disturbs other folders, scroll position, or table layout.
 * - Shows calculated total size of books for folders in the Size position.
 * - Author folder titles:
 *     XYZ
 *     Contains X books (or Contains 1 book)
 * - Expand uses down arrow SVG, Collapse uses up arrow SVG.
 * - Mobile removes "Expand" / "Collapse" text, showing clean icon button.
 * - No left border next to numbers.
 * - Light smooth CSS animation on folder expansion.
 * - Full dark mode contrast fix.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'radiology_books_data_v9';

  const DOWNLOAD_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
<path d="M16.44 8.90039C20.04 9.21039 21.51 11.0604 21.51 15.1104V15.2404C21.51 19.7104 19.72 21.5004 15.25 21.5004H8.73998C4.26998 21.5004 2.47998 19.7104 2.47998 15.2404V15.1104C2.47998 11.0904 3.92998 9.24039 7.46998 8.91039" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
<path d="M12 2V14.88" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
<path d="M15.3499 12.6504L11.9999 16.0004L8.6499 12.6504" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

  const LOADER_SVG = `<svg class="container" viewBox="0 0 40 40" height="40" width="40">
  <circle class="track" cx="20" cy="20" r="17.5" pathlength="100" stroke-width="5px" fill="none" />
  <circle class="car" cx="20" cy="20" r="17.5" pathlength="100" stroke-width="5px" fill="none" />
</svg>`;

  // User-requested Down Arrow SVG for Expand
  const EXPAND_ARROW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
<path d="M19.9201 8.9502L13.4001 15.4702C12.6301 16.2402 11.3701 16.2402 10.6001 15.4702L4.08008 8.9502" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

  // User-requested Up Arrow SVG for Collapse
  const COLLAPSE_ARROW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
<path d="M19.9201 15.0496L13.4001 8.52965C12.6301 7.75965 11.3701 7.75965 10.6001 8.52965L4.08008 15.0496" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

  const FOLDER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
<path d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  // State
  let booksData = [];
  let parsedBooks = [];
  let searchQuery = '';
  let groupByAuthor = true;
  let sortBy = 'title-asc';
  let viewMode = localStorage.getItem('books-view-mode') || 'table';
  // Folders start collapsed by default
  let expandedAuthors = new Set();

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
  let groupToggleBtn;

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
    groupToggleBtn = document.getElementById('books-group-toggle-btn');
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
        if (toggleText) toggleText.textContent = lessText;
        hiddenItems.forEach((item) => item.removeAttribute('tabindex'));
      } else {
        wrapper.classList.remove('is-expanded');
        if (toggleText) toggleText.textContent = moreText;
        hiddenItems.forEach((item) => item.setAttribute('tabindex', '-1'));
      }

      if (e.detail > 0) toggleBtn.blur();
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

  function formatSizeBytes(bytes) {
    if (!bytes || bytes <= 0) return '--';
    const gb = 1024 * 1024 * 1024;
    const mb = 1024 * 1024;
    const kb = 1024;
    if (bytes >= gb) {
      const val = (bytes / gb).toFixed(1);
      return val.endsWith('.0') ? val.slice(0, -2) + ' GB' : val + ' GB';
    }
    if (bytes >= mb) {
      const val = (bytes / mb).toFixed(1);
      return val.endsWith('.0') ? val.slice(0, -2) + ' MB' : val + ' MB';
    }
    return Math.round(bytes / kb) + ' KB';
  }

  function cleanTitle(rawTitle) {
    if (!rawTitle) return 'Untitled Book';
    let title = String(rawTitle).trim();
    title = title.replace(/\[\s*(pdf|epub)\s*\]/gi, '');
    title = title.replace(/\(\s*(pdf|epub)\s*\)/gi, '');
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
        author: b.author || 'General Medical Literature',
        authorGroup: b.authorGroup || b.author || 'Medical Literature',
        category: b.category || 'General',
        bookType: b.bookType || 'PDF',
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
      const res = await fetch('/data/books.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      booksData = Array.isArray(data) ? data : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(booksData));
      parsedBooks = processBooksData(booksData);
      applyFilterAndRender();
    } catch (err) {
      console.warn('Network fetch error, trying cache fallback:', err);
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
        } catch (e) {}
      }
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

    // Group By Author toggle button
    if (groupToggleBtn) {
      groupToggleBtn.classList.toggle('is-active', groupByAuthor);
      groupToggleBtn.setAttribute('aria-pressed', String(groupByAuthor));

      groupToggleBtn.addEventListener('click', () => {
        groupByAuthor = !groupByAuthor;
        groupToggleBtn.classList.toggle('is-active', groupByAuthor);
        groupToggleBtn.setAttribute('aria-pressed', String(groupByAuthor));
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
        if (isOpen) closeSortMenu();
        else openSortMenu();
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

          if (sortSelect) sortSelect.value = val;

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

      document.addEventListener('click', (e) => {
        if (sortDropdown && !sortDropdown.contains(e.target)) closeSortMenu();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sortMenu.classList.contains('is-open')) {
          closeSortMenu();
          sortTrigger.focus();
        }
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        applyFilterAndRender();
      });
    }

    if (viewTableBtn) {
      viewTableBtn.addEventListener('click', () => setViewMode('table'));
    }

    if (viewGridBtn) {
      viewGridBtn.addEventListener('click', () => setViewMode('grid'));
    }

    // Event delegation for clicks in booksContainer
    if (booksContainer) {
      booksContainer.addEventListener('click', (e) => {
        // 1. Download button
        const dlBtn = e.target.closest('.book-download-btn');
        if (dlBtn) {
          e.preventDefault();
          e.stopPropagation();
          handleDownloadWithLoader(dlBtn);
          return;
        }

        // 2. Folder row or collapse button click -> targeted zero-CLS toggle
        const folderTarget = e.target.closest('.author-folder-row, .author-grid-group-header, .author-collapse-btn');
        if (folderTarget) {
          e.preventDefault();
          e.stopPropagation();
          const folderId = folderTarget.getAttribute('data-folder-id') || folderTarget.closest('[data-folder-id]')?.getAttribute('data-folder-id');
          const authorGroupKey = folderTarget.getAttribute('data-author-group') || folderTarget.closest('[data-author-group]')?.getAttribute('data-author-group');
          if (authorGroupKey) {
            toggleAuthorCollapse(authorGroupKey, folderId);
          }
        }
      });

      // Keyboard support for folder rows
      booksContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('button, a')) return; // Native click will handle buttons and links without duplicate toggle
          const folderRow = e.target.closest('.author-folder-row, .author-grid-group-header');
          if (folderRow) {
            e.preventDefault();
            const folderId = folderRow.getAttribute('data-folder-id');
            const authorGroupKey = folderRow.getAttribute('data-author-group');
            if (authorGroupKey) {
              toggleAuthorCollapse(authorGroupKey, folderId);
            }
          }
        }
      });
    }

    // Cross-tab storage updates
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

  /**
   * Targeted in-place DOM Accordion Toggle.
   * Completely eliminates CLS and prevents affecting any other folder or scroll position!
   */
  function toggleAuthorCollapse(authorKey, folderId) {
    const isCurrentlyExpanded = expandedAuthors.has(authorKey);
    const willExpand = !isCurrentlyExpanded;

    if (willExpand) {
      expandedAuthors.add(authorKey);
    } else {
      expandedAuthors.delete(authorKey);
    }

    if (!booksContainer) return;

    // 1. Table Mode targeted toggle
    const folderRow = (folderId ? booksContainer.querySelector(`.author-folder-row[data-folder-id="${folderId}"]`) : null) ||
                      booksContainer.querySelector(`.author-folder-row[data-author-group="${CSS.escape(authorKey)}"]`);
    if (folderRow) {
      const activeFolderId = folderRow.getAttribute('data-folder-id') || folderId;
      folderRow.setAttribute('aria-expanded', String(willExpand));
      folderRow.classList.toggle('folder-is-open', willExpand);

      const btn = folderRow.querySelector('.author-collapse-btn');
      if (btn) {
        btn.classList.toggle('is-expanded', willExpand);
        btn.classList.toggle('is-collapsed', !willExpand);
        btn.setAttribute('aria-expanded', String(willExpand));
        const textSpan = btn.querySelector('.author-collapse-text');
        if (textSpan) textSpan.textContent = willExpand ? 'Collapse' : 'Expand';
        const svgEl = btn.querySelector('svg');
        if (svgEl) {
          svgEl.outerHTML = willExpand ? COLLAPSE_ARROW_SVG : EXPAND_ARROW_SVG;
        }
      }

      if (activeFolderId) {
        const childRows = booksContainer.querySelectorAll(`tr[data-parent-folder-id="${activeFolderId}"]`);
        childRows.forEach((row) => {
          if (willExpand) {
            row.removeAttribute('hidden');
            row.style.display = '';
          } else {
            row.setAttribute('hidden', 'true');
            row.style.display = 'none';
          }
        });
      }
      return; // Zero CLS! Other folders remain completely undisturbed
    }

    // 2. Grid Mode targeted toggle
    const gridGroup = (folderId ? booksContainer.querySelector(`.author-grid-group[data-folder-id="${folderId}"]`) : null) ||
                      booksContainer.querySelector(`.author-grid-group[data-author-group="${CSS.escape(authorKey)}"]`);
    if (gridGroup) {
      const activeFolderId = gridGroup.getAttribute('data-folder-id') || folderId;
      const headerEl = gridGroup.querySelector('.author-grid-group-header');
      if (headerEl) headerEl.setAttribute('aria-expanded', String(willExpand));

      const btn = gridGroup.querySelector('.author-collapse-btn');
      if (btn) {
        btn.classList.toggle('is-expanded', willExpand);
        btn.classList.toggle('is-collapsed', !willExpand);
        btn.setAttribute('aria-expanded', String(willExpand));
        const textSpan = btn.querySelector('.author-collapse-text');
        if (textSpan) textSpan.textContent = willExpand ? 'Collapse' : 'Expand';
        const svgEl = btn.querySelector('svg');
        if (svgEl) {
          svgEl.outerHTML = willExpand ? COLLAPSE_ARROW_SVG : EXPAND_ARROW_SVG;
        }
      }

      if (activeFolderId) {
        const cardsContainer = gridGroup.querySelector(`.author-grid-cards[data-parent-folder-id="${activeFolderId}"]`);
        if (cardsContainer) {
          if (willExpand) {
            cardsContainer.removeAttribute('hidden');
            cardsContainer.style.display = '';
            cardsContainer.classList.add('is-open');
          } else {
            cardsContainer.setAttribute('hidden', 'true');
            cardsContainer.style.display = 'none';
            cardsContainer.classList.remove('is-open');
          }
        }
      }
      return;
    }
  }

  /* --------------------------------------------------------------------------
     4. Download Handler with Background Fetch & Loader
     -------------------------------------------------------------------------- */
  async function handleDownloadWithLoader(btn) {
    if (btn.classList.contains('is-loading')) return;

    const downloadUrl = btn.getAttribute('data-download-url');
    const bookTitle = btn.getAttribute('data-book-title') || 'radiology-book';
    const bookCategory = btn.getAttribute('data-book-category') || 'Reference Literature';
    const bookSize = btn.getAttribute('data-book-size') || '36 MB';

    if (!downloadUrl || downloadUrl === '#' || downloadUrl === '') {
      return;
    }

    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    const originalContent = btn.innerHTML;
    btn.innerHTML = LOADER_SVG;

    const minLoadTime = 1100;
    const startTime = Date.now();
    let blob = null;
    let filename = '';

    try {
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
      console.warn('Direct fetch prevented by CORS, triggering fallback link download:', fetchErr);
    }

    const elapsed = Date.now() - startTime;
    if (elapsed < minLoadTime) {
      await new Promise((resolve) => setTimeout(resolve, minLoadTime - elapsed));
    }

    if (!filename) {
      try {
        const urlObj = new URL(downloadUrl, window.location.href);
        const pathParts = urlObj.pathname.split('/');
        filename = pathParts[pathParts.length - 1] || '';
      } catch (e) {
        filename = '';
      }
      if (!filename || !filename.includes('.')) {
        const isZip = downloadUrl.includes('.zip') || bookTitle.toLowerCase().includes('zip');
        const ext = isZip ? '.zip' : '.pdf';
        filename = (bookTitle.replace(/[^a-zA-Z0-9_-]/g, '_') || 'radiology-book') + ext;
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

    try {
      const KEY = 'radiology_downloads_history_v1';
      let list = JSON.parse(localStorage.getItem(KEY) || '[]');
      list = list.filter((d) => d && d.title !== bookTitle);
      list.unshift({
        id: 'dl-' + Date.now(),
        title: bookTitle,
        category: bookCategory,
        format: bookTitle.toLowerCase().includes('zip') ? 'ZIP' : 'PDF',
        size: bookSize,
        timestamp: Date.now(),
        url: downloadUrl
      });
      localStorage.setItem(KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('downloads-updated', { detail: list }));
    } catch (e) {
      console.warn('Could not record download history:', e);
    }

    btn.classList.remove('is-loading');
    btn.removeAttribute('aria-busy');
    btn.innerHTML = originalContent;
  }

  function setViewMode(mode) {
    viewMode = mode;
    localStorage.setItem('books-view-mode', mode);
    if (viewTableBtn) viewTableBtn.classList.toggle('is-active', mode === 'table');
    if (viewGridBtn) viewGridBtn.classList.toggle('is-active', mode === 'grid');
    applyFilterAndRender();
  }

  /* --------------------------------------------------------------------------
     5. Filter & Sorting Engine
     -------------------------------------------------------------------------- */
  function getFilteredBooks() {
    let filtered = parsedBooks.slice();

    if (searchQuery) {
      filtered = filtered.filter((b) => {
        return (
          b.title.toLowerCase().includes(searchQuery) ||
          b.author.toLowerCase().includes(searchQuery) ||
          b.authorGroup.toLowerCase().includes(searchQuery) ||
          b.category.toLowerCase().includes(searchQuery) ||
          b.size.toLowerCase().includes(searchQuery)
        );
      });
    }

    return filtered;
  }

  function sortBookList(list) {
    return list.slice().sort((a, b) => {
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
  }

  /**
   * Folderize ALL books under Author name.
   * Every author gets their own folder (even 1-book authors), exactly as requested.
   */
  function groupBooksByAuthor(books) {
    const folders = [];
    const map = new Map();

    books.forEach((b) => {
      const key = b.authorGroup || b.author || 'Other Medical Literature';
      if (!map.has(key)) {
        map.set(key, {
          name: key,
          category: b.category || 'General',
          books: [],
          totalBytes: 0
        });
      }
      map.get(key).books.push(b);
    });

    map.forEach((grp) => {
      // Calculate total size of all books inside the folder
      grp.totalBytes = grp.books.reduce((acc, b) => acc + (b.sizeBytes || 0), 0);

      if (sortBy !== 'title-asc') {
        grp.books = sortBookList(grp.books);
      }

      folders.push(grp);
    });

    // Sort folders alphabetically
    folders.sort((a, b) => a.name.localeCompare(b.name));

    return {
      folders,
      standaloneBooks: []
    };
  }

  function applyFilterAndRender() {
    const filtered = getFilteredBooks();

    if (!booksContainer) return;

    if (filtered.length === 0) {
      renderEmptyState();
      return;
    }

    const isMobile = window.innerWidth <= 768;

    if (groupByAuthor && !searchQuery) {
      const groupedData = groupBooksByAuthor(filtered);
      if (viewMode === 'table' || isMobile) {
        renderGroupedTableView(groupedData);
      } else {
        renderGroupedGridView(groupedData);
      }
    } else {
      const sorted = sortBookList(filtered);
      if (viewMode === 'table' || isMobile) {
        renderFlatTableView(sorted);
      } else {
        renderFlatGridView(sorted);
      }
    }
  }

  /* --------------------------------------------------------------------------
     6. Render Grouped Views (Zero-CLS Table View)
     -------------------------------------------------------------------------- */
  function renderGroupedTableView(groupedData) {
    const { folders } = groupedData;
    let rowsHtml = '';

    folders.forEach((grp, folderIdx) => {
      const folderId = 'author-grp-' + folderIdx;
      const isExpanded = expandedAuthors.has(grp.name);
      const chevronClass = isExpanded ? 'is-expanded' : 'is-collapsed';
      const toggleText = isExpanded ? 'Collapse' : 'Expand';
      const arrowIcon = isExpanded ? COLLAPSE_ARROW_SVG : EXPAND_ARROW_SVG;
      const totalFolderSize = formatSizeBytes(grp.totalBytes);
      const bookCountText = grp.books.length === 1 ? 'Contains 1 book' : `Contains ${grp.books.length} books`;

      // Folder Header Row
      rowsHtml += `
        <tr class="author-folder-row ${isExpanded ? 'folder-is-open' : ''}" data-folder-id="${folderId}" data-author-group="${escapeHtml(grp.name)}" role="button" tabindex="0" aria-expanded="${isExpanded}">
          <td class="td-book-title td-folder-title">
            <div class="author-folder-title-cell">
              <span class="author-folder-avatar" aria-hidden="true">${FOLDER_ICON_SVG}</span>
              <div class="author-folder-text-wrap">
                <span class="author-folder-name">${escapeHtml(grp.name)}</span>
                <span class="author-folder-contains">${bookCountText}</span>
              </div>
            </div>
          </td>
          <td class="td-book-size td-folder-size">
            <span class="book-size-badge is-folder-size" title="Total Folder Size">${escapeHtml(totalFolderSize)}</span>
          </td>
          <td class="td-book-download td-folder-action">
            <div class="book-action-group">
              <button type="button" class="author-collapse-btn ${chevronClass}" data-folder-id="${folderId}" data-author-group="${escapeHtml(grp.name)}" aria-expanded="${isExpanded}" aria-label="${toggleText} ${escapeHtml(grp.name)}">
                <span class="author-collapse-text">${toggleText}</span>
                ${arrowIcon}
              </button>
            </div>
          </td>
        </tr>
      `;

      // Pre-render volume rows with hidden attribute if collapsed for zero-CLS instantaneous toggle
      const hiddenAttr = isExpanded ? '' : 'hidden';
      const displayStyle = isExpanded ? '' : 'style="display: none;"';

      grp.books.forEach((b, idx) => {
        rowsHtml += renderFolderVolumeRow(b, idx + 1, folderId, hiddenAttr, displayStyle);
      });

      // Folder closure row
      rowsHtml += `
        <tr class="folder-closure-row" data-parent-folder-id="${folderId}" ${hiddenAttr} ${displayStyle}>
          <td colspan="3"><div class="folder-closure-line"></div></td>
        </tr>
      `;
    });

    const html = `
      <div class="books-table-wrapper" tabindex="0" role="region" aria-label="Books table list">
        <table class="books-table">
          <colgroup>
            <col class="col-book-title">
            <col class="col-book-size">
            <col class="col-book-download">
          </colgroup>
          <thead>
            <tr>
              <th scope="col" class="th-book-title">Book Title</th>
              <th scope="col" class="th-book-size">Size</th>
              <th scope="col" class="th-book-download">Save</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
    booksContainer.innerHTML = html;
  }

  // Row for a book inside an expanded author folder (clean numbered items in table, NO left border)
  function renderFolderVolumeRow(b, itemNumber, parentFolderId, hiddenAttr, displayStyle) {
    const downloadHref = b.downloadLink || '#';
    const folderAttr = parentFolderId ? `data-parent-folder-id="${parentFolderId}"` : '';
    const hAttr = hiddenAttr || '';
    const dStyle = displayStyle || '';

    return `
      <tr class="is-volume-row" ${folderAttr} ${hAttr} ${dStyle}>
        <td class="td-book-title">
          <div class="book-cell-title">
            <div class="volume-nested-container">
              ${itemNumber !== null && itemNumber !== undefined ? `<span class="volume-number-marker">${itemNumber}.</span>` : ''}
              <a href="${escapeHtml(downloadHref)}" class="book-primary-title" data-download-url="${escapeHtml(b.downloadLink)}" data-book-title="${escapeHtml(b.title)}">
                ${escapeHtml(b.title)}
              </a>
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
                ? `<button type="button" class="book-download-btn" data-download-url="${escapeHtml(b.downloadLink)}" data-book-title="${escapeHtml(b.title)}" data-book-category="${escapeHtml(b.category)}" data-book-size="${escapeHtml(b.size)}" title="Save ${escapeHtml(b.title)}" aria-label="Save ${escapeHtml(b.title)}">
                    ${DOWNLOAD_ICON_SVG}
                  </button>`
                : `<span class="book-no-download" title="No link available">--</span>`
            }
          </div>
        </td>
      </tr>
    `;
  }

  /* --------------------------------------------------------------------------
     7. Render Grouped Grid View (NO Numbers in Card View, Zero CLS)
     -------------------------------------------------------------------------- */
  function renderGroupedGridView(groupedData) {
    const { folders } = groupedData;
    let html = '';

    folders.forEach((grp, folderIdx) => {
      const folderId = 'author-grid-grp-' + folderIdx;
      const isExpanded = expandedAuthors.has(grp.name);
      const chevronClass = isExpanded ? 'is-expanded' : 'is-collapsed';
      const toggleText = isExpanded ? 'Collapse' : 'Expand';
      const arrowIcon = isExpanded ? COLLAPSE_ARROW_SVG : EXPAND_ARROW_SVG;
      const totalFolderSize = formatSizeBytes(grp.totalBytes);
      const bookCountText = grp.books.length === 1 ? 'Contains 1 book' : `Contains ${grp.books.length} books`;

      const hiddenAttr = isExpanded ? '' : 'hidden';
      const displayStyle = isExpanded ? '' : 'style="display: none;"';

      html += `
        <div class="author-grid-group" data-folder-id="${folderId}" data-author-group="${escapeHtml(grp.name)}">
          <div class="author-grid-group-header" data-folder-id="${folderId}" data-author-group="${escapeHtml(grp.name)}" role="button" tabindex="0" aria-expanded="${isExpanded}">
            <div class="author-folder-title-cell">
              <span class="author-folder-avatar" aria-hidden="true">${FOLDER_ICON_SVG}</span>
              <div class="author-folder-text-wrap">
                <span class="author-folder-name">${escapeHtml(grp.name)}</span>
                <span class="author-folder-contains">${bookCountText}</span>
              </div>
            </div>
            <div class="author-folder-grid-actions">
              <span class="book-size-badge is-folder-size">${escapeHtml(totalFolderSize)}</span>
              <button type="button" class="author-collapse-btn ${chevronClass}" data-folder-id="${folderId}" data-author-group="${escapeHtml(grp.name)}" aria-expanded="${isExpanded}">
                <span class="author-collapse-text">${toggleText}</span>
                ${arrowIcon}
              </button>
            </div>
          </div>
          <div class="books-cards-grid author-grid-cards" data-parent-folder-id="${folderId}" ${hiddenAttr} ${displayStyle} role="list">
            ${grp.books.map((b) => renderCardItem(b)).join('')}
          </div>
        </div>
      `;
    });

    booksContainer.innerHTML = html;
  }

  /* --------------------------------------------------------------------------
     8. Flat Views (Used when searching or grouping is turned off)
     -------------------------------------------------------------------------- */
  function renderFlatTableView(books) {
    const html = `
      <div class="books-table-wrapper" tabindex="0" role="region" aria-label="Books table list">
        <table class="books-table">
          <colgroup>
            <col class="col-book-title">
            <col class="col-book-size">
            <col class="col-book-download">
          </colgroup>
          <thead>
            <tr>
              <th scope="col" class="th-book-title">Book Title</th>
              <th scope="col" class="th-book-size">Size</th>
              <th scope="col" class="th-book-download">Save</th>
            </tr>
          </thead>
          <tbody>
            ${books.map((b, idx) => renderFolderVolumeRow(b, idx + 1, null, '', '')).join('')}
          </tbody>
        </table>
      </div>
    `;
    booksContainer.innerHTML = html;
  }

  function renderFlatGridView(books) {
    const html = `
      <div class="books-cards-grid" role="list" aria-label="Books list cards">
        ${books.map((b) => renderCardItem(b)).join('')}
      </div>
    `;
    booksContainer.innerHTML = html;
  }

  // Card view item: Never displays numbers in grid view
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
            ${
              b.author
                ? `<div class="book-author-meta">
                    <span>${escapeHtml(b.author)}</span>
                  </div>`
                : ''
            }
          </div>
        </div>

        <div class="book-card-footer">
          <span class="book-size-badge" title="File Size">
            ${escapeHtml(b.size)}
          </span>

          <div class="book-action-group">
            ${
              b.downloadLink
                ? `<button type="button" class="book-download-btn" data-download-url="${escapeHtml(b.downloadLink)}" data-book-title="${escapeHtml(b.title)}" data-book-category="${escapeHtml(b.category)}" data-book-size="${escapeHtml(b.size)}" title="Save ${escapeHtml(b.title)}" aria-label="Save ${escapeHtml(b.title)}">
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
          Try clearing your search query to browse available books.
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
