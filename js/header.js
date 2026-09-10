/**
 * HEADER JS
 * Handles responsive interactions for the header component:
 * - Hamburger menu toggle and navigation drawer
 * - Minimal Search Modal popup and keyboard navigation
 * - Theme & Palette Modal / Mobile Bottom Sheet
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
  });

  function initHeader() {
    // DOM Elements - Navigation Drawer
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navDrawer = document.getElementById('nav-drawer');
    const navBackdrop = document.getElementById('nav-backdrop');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');
    const navLinks = document.querySelectorAll('.nav-link');

    // DOM Elements - Search Modal
    const searchBtn = document.getElementById('search-btn');
    const searchModalOverlay = document.getElementById('search-modal-overlay');
    const searchModal = document.getElementById('search-modal');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const searchCloseBtn = document.getElementById('search-close-btn');

    // DOM Elements - Theme & Palette Modal
    const modeBtn = document.getElementById('mode-btn');
    const themeModalOverlay = document.getElementById('theme-modal-overlay');
    const themeModal = document.getElementById('theme-modal');
    const themeCloseBtn = document.getElementById('theme-close-btn');
    const modeSelectButtons = document.querySelectorAll('.mode-select-btn');
    const paletteButtons = document.querySelectorAll('.palette-btn');

    // DOM Elements - Desktop Navigation
    const desktopNav = document.getElementById('header-desktop-nav');
    const allDesktopNavItems = document.querySelectorAll('.desktop-nav-item');
    const desktopDropdownItems = document.querySelectorAll('.desktop-nav-item.has-dropdown');

    /* ------------------------------------------------------------------------
       0. Desktop Navigation (Dropdowns & Mega Menu - Strictly Single Active)
       ------------------------------------------------------------------------ */
    let navHoverTimer = null;

    function closeAllDesktopDropdowns() {
      if (navHoverTimer) {
        clearTimeout(navHoverTimer);
        navHoverTimer = null;
      }
      desktopDropdownItems.forEach((item) => {
        item.classList.remove('is-open');
        const btn = item.querySelector('.desktop-nav-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }

    if (desktopNav) {
      // Direct link items (no dropdown) also close dropdowns immediately when hovered
      allDesktopNavItems.forEach((item) => {
        if (!item.classList.contains('has-dropdown')) {
          item.addEventListener('mouseenter', () => {
            closeAllDesktopDropdowns();
          });
        }
      });

      desktopDropdownItems.forEach((item) => {
        const btn = item.querySelector('.desktop-nav-btn');
        const panel = item.querySelector('.desktop-dropdown-panel');

        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasOpen = item.classList.contains('is-open');
            closeAllDesktopDropdowns();
            if (!wasOpen) {
              item.classList.add('is-open');
              btn.setAttribute('aria-expanded', 'true');
            }
          });

          // Keyboard navigation: Space/Enter opens, ArrowDown moves into panel
          btn.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              closeAllDesktopDropdowns();
              item.classList.add('is-open');
              btn.setAttribute('aria-expanded', 'true');
              if (panel) {
                const firstLink = panel.querySelector('a');
                if (firstLink) firstLink.focus();
              }
            }
          });
        }

        // Hover handling with instant previous-menu clearing
        item.addEventListener('mouseenter', () => {
          if (navHoverTimer) {
            clearTimeout(navHoverTimer);
            navHoverTimer = null;
          }
          // Close all other dropdowns immediately
          desktopDropdownItems.forEach((other) => {
            if (other !== item) {
              other.classList.remove('is-open');
              const otherBtn = other.querySelector('.desktop-nav-btn');
              if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
            }
          });
          item.classList.add('is-open');
          if (btn) btn.setAttribute('aria-expanded', 'true');
        });

        item.addEventListener('mouseleave', () => {
          if (navHoverTimer) clearTimeout(navHoverTimer);
          navHoverTimer = setTimeout(() => {
            item.classList.remove('is-open');
            if (btn) btn.setAttribute('aria-expanded', 'false');
          }, 140);
        });

        // Close when focus leaves the item completely
        item.addEventListener('focusout', (e) => {
          if (!item.contains(e.relatedTarget)) {
            item.classList.remove('is-open');
            if (btn) btn.setAttribute('aria-expanded', 'false');
          }
        });

        // Clicking links inside panel closes the dropdown smoothly
        if (panel) {
          const links = panel.querySelectorAll('a');
          links.forEach((link) => {
            link.addEventListener('click', () => {
              closeAllDesktopDropdowns();
            });
          });
        }
      });

      // Global click outside to close desktop dropdowns
      document.addEventListener('click', (e) => {
        if (desktopNav && !desktopNav.contains(e.target)) {
          closeAllDesktopDropdowns();
        }
      });
    }

    /* ------------------------------------------------------------------------
       1. Hamburger Menu & Navigation Drawer
       ------------------------------------------------------------------------ */
    function openDrawer() {
      if (!navDrawer || !hamburgerBtn) return;
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      navDrawer.classList.add('is-open');
      if (navBackdrop) navBackdrop.classList.add('is-active');
      document.body.classList.add('nav-drawer-open');
    }

    function closeDrawer() {
      if (!navDrawer || !hamburgerBtn) return;
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      navDrawer.classList.remove('is-open');
      if (navBackdrop) navBackdrop.classList.remove('is-active');
      document.body.classList.remove('nav-drawer-open');
    }

    function toggleDrawer() {
      const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeDrawer();
      } else {
        openDrawer();
      }
    }

    if (hamburgerBtn) {
      hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDrawer();
      });
    }

    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDrawer();
      });
    }

    if (navBackdrop) {
      navBackdrop.addEventListener('click', () => {
        closeDrawer();
      });
    }

    /* ------------------------------------------------------------------------
       Expandable Tree-View Navigation Logic
       ------------------------------------------------------------------------ */
    const treeRoot = document.getElementById('tree-root');

    /**
     * Toggles a parent tree item expanded/collapsed state
     */
    function toggleParentItem(parentItem, forceState) {
      if (!parentItem) return;
      const row = parentItem.querySelector('.tree-parent-row');
      const chevronBtn = parentItem.querySelector('.tree-chevron-btn');
      const wrapper = parentItem.querySelector('.tree-children-wrapper');

      const isCurrentlyExpanded = parentItem.classList.contains('is-expanded');
      const shouldExpand = typeof forceState === 'boolean' ? forceState : !isCurrentlyExpanded;

      if (shouldExpand) {
        parentItem.classList.add('is-expanded');
        if (wrapper) wrapper.classList.add('is-expanded');
        if (row) row.setAttribute('aria-expanded', 'true');
        if (chevronBtn) chevronBtn.setAttribute('aria-expanded', 'true');
      } else {
        parentItem.classList.remove('is-expanded');
        if (wrapper) wrapper.classList.remove('is-expanded');
        if (row) row.setAttribute('aria-expanded', 'false');
        if (chevronBtn) chevronBtn.setAttribute('aria-expanded', 'false');
      }
    }

    /**
     * Selects an active tree item
     */
    function selectTreeItem(itemEl) {
      if (!itemEl) return;
      const allRows = document.querySelectorAll('.tree-row');
      allRows.forEach((r) => {
        r.classList.remove('is-active');
        r.setAttribute('aria-selected', 'false');
      });

      const activeRow = itemEl.querySelector('.tree-row');
      if (activeRow) {
        activeRow.classList.add('is-active');
        activeRow.setAttribute('aria-selected', 'true');
      }

      // Close drawer on mobile screens (< 1024px) for a responsive workflow
      if (window.innerWidth < 1024) {
        closeDrawer();
      }
    }

    // Attach click and keyboard listeners to all tree parents
    const treeParents = document.querySelectorAll('.tree-parent');
    treeParents.forEach((parent) => {
      const row = parent.querySelector('.tree-parent-row');
      const chevronBtn = parent.querySelector('.tree-chevron-btn');

      if (chevronBtn) {
        chevronBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleParentItem(parent);
        });
      }

      if (row) {
        row.addEventListener('click', (e) => {
          toggleParentItem(parent);
        });

        // Accessible keyboard navigation for tree parent items
        row.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleParentItem(parent);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            toggleParentItem(parent, true);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            toggleParentItem(parent, false);
          }
        });
      }
    });

    // Attach click and keyboard listeners to all tree leaves
    const treeLeaves = document.querySelectorAll('.tree-leaf');
    treeLeaves.forEach((leaf) => {
      const leafLink = leaf.querySelector('.tree-leaf-link');
      if (leafLink) {
        leafLink.addEventListener('click', (e) => {
          e.preventDefault();
          selectTreeItem(leaf);
        });

        leafLink.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectTreeItem(leaf);
          }
        });
      }
    });

    /* ------------------------------------------------------------------------
       2. Clean Minimal Search Modal Interactions
       ------------------------------------------------------------------------ */
    function openSearchModal() {
      if (!searchModalOverlay || !searchBtn) return;
      // Close theme modal and desktop dropdowns if open
      closeThemeModal();
      closeAllDesktopDropdowns();
      searchModalOverlay.classList.add('is-active');
      searchBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('modal-open');

      if (searchInput) {
        setTimeout(() => {
          searchInput.focus();
        }, 60);
      }
    }

    function closeSearchModal() {
      if (!searchModalOverlay || !searchBtn) return;
      if (searchModal) {
        searchModal.style.transform = '';
        searchModal.style.transition = '';
      }
      searchModalOverlay.classList.remove('is-active');
      searchBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('modal-open');
      if (searchInput) {
        searchInput.blur();
      }
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openSearchModal();
      });
    }

    if (searchCloseBtn) {
      searchCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSearchModal();
      });
    }

    if (searchModalOverlay) {
      searchModalOverlay.addEventListener('click', (e) => {
        if (searchModal && !searchModal.contains(e.target)) {
          closeSearchModal();
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        if (searchClearBtn) {
          if (searchInput.value.trim().length > 0) {
            searchClearBtn.classList.add('is-visible');
          } else {
            searchClearBtn.classList.remove('is-visible');
          }
        }
      });
    }

    if (searchClearBtn && searchInput) {
      searchClearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchInput.value = '';
        searchClearBtn.classList.remove('is-visible');
        searchInput.focus();
      });
    }

    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput ? searchInput.value.trim() : '';
        if (query) {
          if (typeof window.radiologySearch === 'function') {
            window.radiologySearch(query, `Query: "${query}"`);
          }
          closeSearchModal();
        }
      });
    }

    /* Mobile Search Sheet Touch Swipe-Down Dismiss with rAF throttling for 60fps */
    if (searchModal) {
      let touchStartY = 0;
      let touchCurrentY = 0;
      let isDraggingSheet = false;
      let searchRafId = null;

      searchModal.addEventListener('touchstart', (e) => {
        if (window.innerWidth >= 640) return;
        if (e.target === searchInput) return;
        touchStartY = e.touches[0].clientY;
        touchCurrentY = touchStartY;
        isDraggingSheet = true;
      }, { passive: true });

      searchModal.addEventListener('touchmove', (e) => {
        if (!isDraggingSheet || window.innerWidth >= 640) return;
        touchCurrentY = e.touches[0].clientY;
        const deltaY = touchCurrentY - touchStartY;
        if (deltaY > 0) {
          if (!searchRafId) {
            searchRafId = requestAnimationFrame(() => {
              searchModal.style.transition = 'none';
              searchModal.style.transform = `translate3d(0, ${deltaY}px, 0)`;
              searchRafId = null;
            });
          }
        }
      }, { passive: true });

      searchModal.addEventListener('touchend', () => {
        if (!isDraggingSheet || window.innerWidth >= 640) return;
        isDraggingSheet = false;
        if (searchRafId) {
          cancelAnimationFrame(searchRafId);
          searchRafId = null;
        }
        const deltaY = touchCurrentY - touchStartY;
        searchModal.style.transition = '';
        if (deltaY > 60) {
          closeSearchModal();
        } else {
          searchModal.style.transform = '';
        }
      });
    }

    /* ------------------------------------------------------------------------
       3. Theme & Palette Modal / Mobile Bottom Sheet Interactions
       ------------------------------------------------------------------------ */
    function openThemeModal() {
      if (!themeModalOverlay || !modeBtn) return;
      // Close search modal and desktop dropdowns if open
      closeSearchModal();
      closeAllDesktopDropdowns();
      themeModalOverlay.classList.add('is-active');
      modeBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('modal-open');
    }

    function closeThemeModal() {
      if (!themeModalOverlay || !modeBtn) return;
      if (themeModal) {
        themeModal.style.transform = '';
        themeModal.style.transition = '';
      }
      themeModalOverlay.classList.remove('is-active');
      modeBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('modal-open');
    }

    if (modeBtn) {
      modeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (themeModalOverlay && themeModalOverlay.classList.contains('is-active')) {
          closeThemeModal();
        } else {
          openThemeModal();
        }
      });
    }

    if (themeCloseBtn) {
      themeCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeThemeModal();
      });
    }

    // Close when clicking outside theme modal card
    if (themeModalOverlay) {
      themeModalOverlay.addEventListener('click', (e) => {
        if (themeModal && !themeModal.contains(e.target)) {
          closeThemeModal();
        }
      });
    }

    // Mode Buttons inside Modal (Light / Dark)
    modeSelectButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const modeVal = btn.getAttribute('data-mode-val');
        if (window.GlobalTheme && typeof window.GlobalTheme.setTheme === 'function') {
          window.GlobalTheme.setTheme(modeVal);
        }
      });
    });

    // Palette Buttons inside Modal (10 Subtle Material Tones)
    paletteButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const paletteVal = btn.getAttribute('data-palette-val');
        if (window.GlobalTheme && typeof window.GlobalTheme.setPalette === 'function') {
          window.GlobalTheme.setPalette(paletteVal);
        }
      });
    });

    /* Mobile Theme Sheet Touch Swipe-Down Dismiss with rAF throttling */
    if (themeModal) {
      let touchStartY = 0;
      let touchCurrentY = 0;
      let isDraggingSheet = false;
      let themeRafId = null;

      themeModal.addEventListener('touchstart', (e) => {
        if (window.innerWidth >= 640) return;
        touchStartY = e.touches[0].clientY;
        touchCurrentY = touchStartY;
        isDraggingSheet = true;
      }, { passive: true });

      themeModal.addEventListener('touchmove', (e) => {
        if (!isDraggingSheet || window.innerWidth >= 640) return;
        touchCurrentY = e.touches[0].clientY;
        const deltaY = touchCurrentY - touchStartY;
        if (deltaY > 0) {
          if (!themeRafId) {
            themeRafId = requestAnimationFrame(() => {
              themeModal.style.transition = 'none';
              themeModal.style.transform = `translate3d(0, ${deltaY}px, 0)`;
              themeRafId = null;
            });
          }
        }
      }, { passive: true });

      themeModal.addEventListener('touchend', () => {
        if (!isDraggingSheet || window.innerWidth >= 640) return;
        isDraggingSheet = false;
        if (themeRafId) {
          cancelAnimationFrame(themeRafId);
          themeRafId = null;
        }
        const deltaY = touchCurrentY - touchStartY;
        themeModal.style.transition = '';
        if (deltaY > 60) {
          closeThemeModal();
        } else {
          themeModal.style.transform = '';
        }
      });
    }

    /* ------------------------------------------------------------------------
       4. Keyboard Shortcuts (Escape to close Modal & Drawer & Dropdowns)
       ------------------------------------------------------------------------ */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllDesktopDropdowns();
        if (themeModalOverlay && themeModalOverlay.classList.contains('is-active')) {
          closeThemeModal();
          return;
        }
        if (searchModalOverlay && searchModalOverlay.classList.contains('is-active')) {
          closeSearchModal();
          return;
        }
        if (navDrawer && navDrawer.classList.contains('is-open')) {
          closeDrawer();
        }
      }

      // Quick slash / shortcut to open search if not typing inside an input
      if (e.key === '/' && document.activeElement !== searchInput) {
        if (searchModalOverlay && !searchModalOverlay.classList.contains('is-active')) {
          e.preventDefault();
          openSearchModal();
        }
      }
    });

    // Throttled resize listener
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) return;
      resizeTimer = requestAnimationFrame(() => {
        if (window.innerWidth >= 1024) {
          closeDrawer();
        }
        resizeTimer = null;
      });
    });

    // Remove preload class after page load to allow smooth user interactions with zero startup lag
    window.addEventListener('load', () => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('preload');
      });
    });
  }
})();
