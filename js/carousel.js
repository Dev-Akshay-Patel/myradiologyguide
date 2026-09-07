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
  });

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
