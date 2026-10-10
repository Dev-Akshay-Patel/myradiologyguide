/**
 * CAROUSEL JS
 * Handles carousel dynamic slide rendering from MRG_CONFIG,
 * transitions, dot indicators, autoplay with pause on hover/focus,
 * touch gestures, and keyboard navigation.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initCarousel();
    initTopicsShowMore();
    initPinnedPostActions();
  });

  // Re-render when config changes from Admin
  window.addEventListener('mrgconfigchange', () => {
    initCarousel(true);
  });
  window.addEventListener('carouselconfigchange', () => {
    initCarousel(true);
  });

  function initPinnedPostActions() {
    const bookmarkBtn = document.getElementById('pinned-bookmark-btn');
    const bookmarkText = document.getElementById('pinned-bookmark-text');
    const shareBtn = document.getElementById('pinned-share-btn');
    const shareText = document.getElementById('pinned-share-text');

    const PINNED_SVG_PLUS = `<g clip-path="url(#clip0_save_btn)">
        <path d="M14.5 10.6504H9.5" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M12 8.21094V13.2109" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M16.8199 2H7.17995C5.04995 2 3.31995 3.74 3.31995 5.86V19.95C3.31995 21.75 4.60995 22.51 6.18995 21.64L11.0699 18.93C11.5899 18.64 12.4299 18.64 12.9399 18.93L17.8199 21.64C19.3999 22.52 20.6899 21.76 20.6899 19.95V5.86C20.6799 3.74 18.9499 2 16.8199 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_save_btn">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>`;
    const PINNED_SVG_MINUS = `<g clip-path="url(#clip0_save_btn)">
        <path d="M14.5 10.6504H9.5" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M12 8.21094V13.2109" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M16.8199 2H7.17995C5.04995 2 3.31995 3.74 3.31995 5.86V19.95C3.31995 21.75 4.60995 22.51 6.18995 21.64L11.0699 18.93C11.5899 18.64 12.4299 18.64 12.9399 18.93L17.8199 21.64C19.3999 22.52 20.6899 21.76 20.6899 19.95V5.86C20.6799 3.74 18.9499 2 16.8199 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_save_btn">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>`;

    const PINNED_POST_ID = 'stroke-cta-protocol';

    function updatePinnedBookmarkUI(saved) {
      if (!bookmarkBtn) return;
      bookmarkBtn.classList.toggle('is-active', !!saved);
      bookmarkBtn.setAttribute('aria-pressed', String(!!saved));
      bookmarkBtn.setAttribute('title', saved ? 'Saved to Bookmarks' : 'Save protocol');
      const iconSvg = bookmarkBtn.querySelector('svg');
      if (iconSvg) {
        iconSvg.innerHTML = saved ? PINNED_SVG_MINUS : PINNED_SVG_PLUS;
      }
      if (bookmarkText) {
        bookmarkText.textContent = saved ? 'Saved' : 'Save';
      }
    }

    if (bookmarkBtn) {
      const initialSaved = window.RadiologyAuth && typeof window.RadiologyAuth.isBookmarked === 'function'
        ? window.RadiologyAuth.isBookmarked(PINNED_POST_ID)
        : false;
      updatePinnedBookmarkUI(initialSaved);

      bookmarkBtn.addEventListener('click', () => {
        let isNowSaved = false;
        if (window.RadiologyAuth && typeof window.RadiologyAuth.toggleBookmark === 'function') {
          isNowSaved = window.RadiologyAuth.toggleBookmark(PINNED_POST_ID);
          if (window.RadiologyAuth.showToast) {
            window.RadiologyAuth.showToast(isNowSaved ? 'Bookmark saved to your account' : 'Bookmark removed from your account', isNowSaved ? 'success' : 'info');
          }
        } else {
          isNowSaved = bookmarkBtn.classList.toggle('is-active');
        }
        updatePinnedBookmarkUI(isNowSaved);
      });

      window.addEventListener('bookmarks-updated', () => {
        if (window.RadiologyAuth && typeof window.RadiologyAuth.isBookmarked === 'function') {
          updatePinnedBookmarkUI(window.RadiologyAuth.isBookmarked(PINNED_POST_ID));
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (typeof window.openShareModal === 'function') {
          const pinnedTitleEl = document.getElementById('pinned-title-link');
          const pinnedDescEl = document.getElementById('pinned-post-desc');
          const title = pinnedTitleEl ? pinnedTitleEl.textContent.trim() : 'Acute Ischemic Stroke: Multiphase CTA Collateral Atlas & ASPECTS Triage Protocol';
          const description = pinnedDescEl ? pinnedDescEl.textContent.trim() : 'Comprehensive acute neurovascular imaging pathway covering rapid collateral grading, early ischemic core mapping, and standardized acute triage.';
          const url = window.location.origin + '/post/?id=neuroradiology-stroke-cta';
          const image = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80';
          window.openShareModal({ title, description, url, image });
        }
      });
    }
  }

  function initTopicsShowMore() {
    const toggleBtn = document.getElementById('topics-toggle-btn');
    const wrapper = document.getElementById('topics-expandable-wrapper');
    const toggleText = document.getElementById('topics-toggle-text');
    const hiddenItems = document.querySelectorAll('.topic-item.is-hidden-initially');

    if (!toggleBtn || !wrapper) return;

    const moreText = toggleBtn.getAttribute('data-more-text') || 'Show More Topics';
    const lessText = toggleBtn.getAttribute('data-less-text') || 'Show Less Topics';

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      const willExpand = !isExpanded;

      const lockedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

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

      const startTime = performance.now();
      const lockDuration = 420;

      function lockScroll(now) {
        const currentY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        if (Math.abs(currentY - lockedScrollY) > 0.5) {
          window.scrollTo({ top: lockedScrollY, behavior: 'instant' });
        }
        if (now - startTime < lockDuration) {
          requestAnimationFrame(lockScroll);
        }
      }

      requestAnimationFrame(lockScroll);
    });
  }

  function initCarousel(forceReRender = false) {
    const container = document.getElementById('featured-carousel');
    if (!container) return;

    const track = container.querySelector('.carousel-track');
    const dotsContainer = container.querySelector('.carousel-dots');
    if (!track) return;

    const existingSlides = track.querySelectorAll('.carousel-slide');
    const slidesData = window.MRG_CONFIG?.carousel;
    if (forceReRender || existingSlides.length === 0) {
      if (Array.isArray(slidesData) && slidesData.length > 0) {
        // Re-render track with dynamic slides maintaining full rich markup
        let slidesHtml = '';
        slidesData.forEach((s, idx) => {
          const isActive = idx === 0;
          const rawTags = Array.isArray(s.tags) ? s.tags : (s.tag ? [s.tag] : ['Clinical Reference']);
          const tagsHtml = rawTags.map(tag => `
            <span class="slide-tag">
              <svg class="slide-tag-hash-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M10 3L8 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M16 3L14 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M3.5 9H21.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M2.5 15H20.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>${tag}
            </span>
          `).join('');

          slidesHtml += `
            <article class="carousel-slide ${isActive ? 'is-active' : ''}" role="group" aria-roledescription="slide" aria-label="${idx + 1} of ${slidesData.length}" aria-hidden="${!isActive}">
              <img
                src="${s.image || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&auto=format&fit=crop&q=80'}"
                alt="${s.title || 'Slide'}"
                class="carousel-slide-img"
                loading="${idx === 0 ? 'eager' : 'lazy'}"
                referrerpolicy="no-referrer"
                onerror="this.src='https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&auto=format&fit=crop&q=80'"
              />
              <div class="carousel-overlay">
                <div class="slide-tags">
                  ${tagsHtml}
                </div>
                <h2 class="slide-title">
                  ${s.link ? `<a href="${s.link}" style="color: inherit; text-decoration: none;">${s.title || ''}</a>` : (s.title || '')}
                </h2>
                ${s.desc ? `<p class="slide-desc">${s.desc}</p>` : ''}
              </div>
            </article>
          `;
        });
        track.innerHTML = slidesHtml;

        // Re-render dots
        if (dotsContainer) {
          let dotsHtml = '';
          slidesData.forEach((s, idx) => {
            const isActive = idx === 0;
            dotsHtml += `
              <button
                type="button"
                class="carousel-dot ${isActive ? 'is-active' : ''}"
                role="tab"
                aria-selected="${isActive ? 'true' : 'false'}"
                aria-label="Slide ${idx + 1} of ${slidesData.length}: ${s.title || ''}"
                data-slide-index="${idx}"
                tabindex="${isActive ? '0' : '-1'}"
              ></button>
            `;
          });
          dotsContainer.innerHTML = dotsHtml;
        }
      }
    }

    const slides = Array.from(container.querySelectorAll('.carousel-slide'));
    const dots = Array.from(container.querySelectorAll('.carousel-dot'));
    if (slides.length === 0) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoplayTimer = null;
    const AUTOPLAY_INTERVAL = 5500;

    function goToSlide(index) {
      if (index < 0) {
        currentIndex = totalSlides - 1;
      } else if (index >= totalSlides) {
        currentIndex = 0;
      } else {
        currentIndex = index;
      }

      slides.forEach((slide, idx) => {
        const isActive = idx === currentIndex;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', !isActive);
      });

      dots.forEach((dot, idx) => {
        const isActive = idx === currentIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
        dot.setAttribute('tabindex', isActive ? '0' : '-1');
      });
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex - 1);
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const targetIndex = parseInt(dot.getAttribute('data-slide-index'), 10);
        if (!isNaN(targetIndex)) {
          goToSlide(targetIndex);
          restartAutoplay();
        }
      });
    });

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(() => {
        nextSlide();
      }, AUTOPLAY_INTERVAL);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function restartAutoplay() {
      startAutoplay();
    }

    container.addEventListener('mouseenter', stopAutoplay);
    container.addEventListener('mouseleave', startAutoplay);
    container.addEventListener('focusin', stopAutoplay);
    container.addEventListener('focusout', startAutoplay);

    // Keyboard navigation
    container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
        restartAutoplay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
        restartAutoplay();
      }
    });

    // Touch gesture navigation
    let touchStartX = 0;
    let touchEndX = 0;
    const SWIPE_THRESHOLD = 50;

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoplay();
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
      startAutoplay();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) >= SWIPE_THRESHOLD) {
        if (diff < 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    }

    startAutoplay();
  }
})();
