/**
 * CAROUSEL JS
 * Handles carousel interactions:
 * - Slide transitions and track translation
 * - Centered dot indicators with active state
 * - Autoplay with pause on hover/focus
 * - Touch swipe gestures for mobile
 * - Keyboard navigation (ArrowLeft / ArrowRight)
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initCarousel();
    initTopicsShowMore();
    initPinnedPostActions();
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
        <path d="M16.8199 2H7.17995C5.04995 2 3.31995 3.74 3.31995 5.86V19.95C3.31995 21.75 4.60995 22.51 6.18995 21.64L11.0699 18.93C11.5899 18.64 12.4299 18.64 12.9399 18.93L17.8199 21.64C19.3999 22.52 20.6899 21.76 20.6899 19.95V5.86C20.6799 3.74 18.9499 2 16.8199 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_save_btn">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>`;

    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', () => {
        const isSaved = bookmarkBtn.classList.toggle('is-active');
        bookmarkBtn.setAttribute('aria-pressed', String(isSaved));
        const iconSvg = bookmarkBtn.querySelector('svg');
        if (iconSvg) {
          iconSvg.innerHTML = isSaved ? PINNED_SVG_MINUS : PINNED_SVG_PLUS;
        }
        if (bookmarkText) {
          bookmarkText.textContent = isSaved ? 'Saved' : 'Save';
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const shareUrl = window.location.href.split('#')[0] + '#stroke-cta-protocol';
        const shareData = {
          title: 'Acute Ischemic Stroke: Multiphase CTA Collateral Atlas & ASPECTS Triage Protocol',
          text: 'Check out this clinical reference protocol on RADPULSE.',
          url: shareUrl,
        };

        let shared = false;
        if (navigator.share) {
          try {
            await navigator.share(shareData);
            shared = true;
          } catch {
            // User cancelled or aborted
          }
        }

        if (!shared && navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(shareUrl);
            if (shareText) {
              const prev = shareText.textContent;
              shareText.textContent = 'Copied!';
              setTimeout(() => {
                shareText.textContent = prev || 'Share';
              }, 2000);
            }
          } catch {
            // Clipboard write failed
          }
        }
      });
    }
  }

  function initTopicsShowMore() {
    const toggleBtn = document.getElementById('topics-toggle-btn');
    const wrapper = document.getElementById('topics-expandable-wrapper');
    if (!toggleBtn || !wrapper) return;

    const toggleText = toggleBtn.querySelector('.topics-toggle-text');
    const hiddenItems = Array.from(wrapper.querySelectorAll('.topic-item'));
    const hiddenCount = hiddenItems.length;

    // Remove hidden items from keyboard navigation order while collapsed
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

      // Capture exact scroll position before state change
      const lockedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

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

      // Prevent browser from auto-scrolling to follow the moving button
      if (e.detail > 0) {
        toggleBtn.blur();
      }

      // Lock scroll position during drawer transition to ensure elements above never shift
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

  function initCarousel() {
    const container = document.getElementById('featured-carousel');
    if (!container) return;

    const track = container.querySelector('.carousel-track');
    const slides = Array.from(container.querySelectorAll('.carousel-slide'));
    const dots = Array.from(container.querySelectorAll('.carousel-dot'));

    if (!track || slides.length === 0) return;

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

      // Fade transition: Toggle slide active classes and ARIA states (smooth CSS cross-fade)
      slides.forEach((slide, idx) => {
        const isActive = idx === currentIndex;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', !isActive);
      });

      // Update dots
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

    // Dot click events
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const targetIndex = parseInt(dot.getAttribute('data-slide-index'), 10);
        if (!isNaN(targetIndex)) {
          goToSlide(targetIndex);
          restartAutoplay();
        }
      });
    });

    // Autoplay logic
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

    // Pause autoplay on mouse enter / focus, resume on leave
    container.addEventListener('mouseenter', stopAutoplay);
    container.addEventListener('mouseleave', startAutoplay);
    container.addEventListener('focusin', stopAutoplay);
    container.addEventListener('focusout', startAutoplay);

    // Keyboard navigation when focused inside carousel
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

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;

    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStartX - touchEndX;
        const diffY = Math.abs(touchStartY - touchEndY);

        // Ensure horizontal swipe is dominant and exceeds threshold
        if (Math.abs(diffX) > 40 && Math.abs(diffX) > diffY) {
          if (diffX > 0) {
            nextSlide();
          } else {
            prevSlide();
          }
          restartAutoplay();
        }
      }
    }, { passive: true });

    // Initial setup
    goToSlide(0);
    startAutoplay();
  }
})();
