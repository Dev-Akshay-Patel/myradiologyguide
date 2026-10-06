/**
 * share-modal.js - Central Share Modal Controller
 * 
 * Provides responsive floating modal (desktop) and bottom sheet (mobile)
 * with post preview card (image on left, title & ellipsis description on right),
 * full-width connecting divider borders, borderless social platform pills,
 * and copy link box showing the URL.
 */
(function () {
  'use strict';

  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80';

  const SHARE_MODAL_HTML = `
    <div class="share-modal-overlay" id="share-modal-overlay" aria-hidden="true">
      <div class="share-modal" id="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
        <!-- Grab handle for mobile bottom sheet swipe down -->
        <div class="bottom-sheet-handle" id="share-sheet-handle" aria-hidden="true"></div>

        <!-- Header: Title & Close Button -->
        <div class="share-modal-header">
          <h2 id="share-modal-title" class="share-modal-title">Share Article</h2>
          <button type="button" class="header-btn share-close-btn" id="share-close-btn" aria-label="Close share dialog">
            <svg class="close-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.17011 15.5794C8.98011 15.5794 8.79011 15.5094 8.64011 15.3594C8.35011 15.0694 8.35011 14.5894 8.64011 14.2994L14.3001 8.63938C14.5901 8.34938 15.0701 8.34938 15.3601 8.63938C15.6501 8.92937 15.6501 9.40937 15.3601 9.69937L9.70011 15.3594C9.56011 15.5094 9.36011 15.5794 9.17011 15.5794Z" fill="white" style="fill: var(--fillg, currentColor);"/>
              <path d="M14.8301 15.5794C14.6401 15.5794 14.4501 15.5094 14.3001 15.3594L8.64011 9.69937C8.35011 9.40937 8.35011 8.92937 8.64011 8.63938C8.93011 8.34938 9.41011 8.34938 9.70011 8.63938L15.3601 14.2994C15.6501 14.5894 15.6501 15.0694 15.3601 15.3594C15.2101 15.5094 15.0201 15.5794 14.8301 15.5794Z" fill="white" style="fill: var(--fillg, currentColor);"/>
              <path d="M15 22.75H9C3.57 22.75 1.25 20.43 1.25 15V9C1.25 3.57 3.57 1.25 9 1.25H15C20.43 1.25 22.75 3.57 22.75 9V15C22.75 20.43 20.43 22.75 15 22.75ZM9 2.75C4.39 2.75 2.75 4.39 2.75 9V15C2.75 19.61 4.39 21.25 9 21.25H15C19.61 21.25 21.25 19.61 21.25 15V9C21.25 4.39 19.61 2.75 15 2.75H9Z" fill="white" style="fill: var(--fillg, currentColor);"/>
            </svg>
          </button>
        </div>

        <!-- Section 1: Post Preview Card (Image on LEFT, Title & Description on RIGHT) -->
        <div class="share-preview-card">
          <img
            id="share-preview-img"
            class="share-preview-img"
            src="${DEFAULT_IMAGE}"
            alt="Article thumbnail preview"
            loading="lazy"
            onerror="this.src='${DEFAULT_IMAGE}'"
          />
          <div class="share-preview-info">
            <h3 id="share-preview-title" class="share-preview-title"></h3>
            <p id="share-preview-desc" class="share-preview-desc"></p>
          </div>
        </div>

        <!-- Border connecting from left to right -->
        <div class="share-modal-divider" role="separator" aria-hidden="true"></div>

        <!-- Section 2: Shareable Social Platforms (Border-less Round Pills) -->
        <div class="share-platforms-section">
          <span class="share-section-label">Share to</span>
          <div class="share-pills-row" id="share-pills-row">
            <button type="button" class="share-platform-pill share-pill-facebook" data-platform="facebook" aria-label="Share on Facebook" title="Share on Facebook">
              <svg class="share-platform-icon" viewBox="0 0 64 64" fill="currentColor">
                <path d="M20.1,36h3.4c0.3,0,0.6,0.3,0.6,0.6V58c0,1.1,0.9,2,2,2h7.8c1.1,0,2-0.9,2-2V36.6c0-0.3,0.3-0.6,0.6-0.6h5.6 c1,0,1.9-0.7,2-1.7l1.3-7.8c0.2-1.2-0.8-2.4-2-2.4h-6.6c-0.5,0-0.9-0.4-0.9-0.9v-5c0-1.3,0.7-2,2-2h5.9c1.1,0,2-0.9,2-2V6.2 c0-1.1-0.9-2-2-2h-7.1c-13,0-12.7,10.5-12.7,12v7.3c0,0.3-0.3,0.6-0.6,0.6h-3.4c-1.1,0-2,0.9-2,2v7.8C18.1,35.1,19,36,20.1,36z"></path>
              </svg>
            </button>
            <button type="button" class="share-platform-pill share-pill-whatsapp" data-platform="whatsapp" aria-label="Share on WhatsApp" title="Share on WhatsApp">
              <svg class="share-platform-icon" viewBox="0 0 64 64" fill="currentColor">
                <path d="M6.9,48.4c-0.4,1.5-0.8,3.3-1.3,5.2c-0.7,2.9,1.9,5.6,4.8,4.8l5.1-1.3c1.7-0.4,3.5-0.2,5.1,0.5 c4.7,2.1,10,3,15.6,2.1c12.3-1.9,22-11.9,23.5-24.2C62,17.3,46.7,2,28.5,4.2C16.2,5.7,6.2,15.5,4.3,27.8c-0.8,5.6,0,10.9,2.1,15.6 C7.1,44.9,7.3,46.7,6.9,48.4z M21.3,19.8c0.6-0.5,1.4-0.9,1.8-0.9s2.3-0.2,2.9,1.2c0.6,1.4,2,4.7,2.1,5.1c0.2,0.3,0.3,0.7,0.1,1.2 c-0.2,0.5-0.3,0.7-0.7,1.1c-0.3,0.4-0.7,0.9-1,1.2c-0.3,0.3-0.7,0.7-0.3,1.4c0.4,0.7,1.8,2.9,3.8,4.7c2.6,2.3,4.9,3,5.5,3.4 c0.7,0.3,1.1,0.3,1.5-0.2c0.4-0.5,1.7-2,2.2-2.7c0.5-0.7,0.9-0.6,1.6-0.3c0.6,0.2,4,1.9,4.7,2.2c0.7,0.3,1.1,0.5,1.3,0.8 c0.2,0.3,0.2,1.7-0.4,3.2c-0.6,1.6-2.1,3.1-3.2,3.5c-1.3,0.5-2.8,0.7-9.3-1.9c-7-2.8-11.8-9.8-12.1-10.3c-0.3-0.5-2.8-3.7-2.8-7.1 C18.9,22.1,20.7,20.4,21.3,19.8z"></path>
              </svg>
            </button>
            <button type="button" class="share-platform-pill share-pill-x" data-platform="x" aria-label="Share on X (Twitter)" title="Share on X">
              <svg class="share-platform-icon" viewBox="0 0 512 512" fill="currentColor">
                <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
              </svg>
            </button>
            <button type="button" class="share-platform-pill share-pill-telegram" data-platform="telegram" aria-label="Share on Telegram" title="Share on Telegram">
              <svg class="share-platform-icon" viewBox="0 0 64 64" fill="currentColor">
                <path d="M56.4,8.2l-51.2,20c-1.7,0.6-1.6,3,0.1,3.5l9.7,2.9c2.1,0.6,3.8,2.2,4.4,4.3l3.8,12.1c0.5,1.6,2.5,2.1,3.7,0.9 l5.2-5.3c0.9-0.9,2.2-1,3.2-0.3l11.5,8.4c1.6,1.2,3.9,0.3,4.3-1.7l8.7-41.8C60.4,9.1,58.4,7.4,56.4,8.2z M50,17.4L29.4,35.6 c-1.1,1-1.9,2.4-2,3.9c-0.2,1.5-2.3,1.7-2.8,0.3l-0.9-3c-0.7-2.2,0.2-4.5,2.1-5.7l23.5-14.6C49.9,16.1,50.5,16.9,50,17.4z"></path>
              </svg>
            </button>
            <button type="button" class="share-platform-pill share-pill-pinterest" data-platform="pinterest" aria-label="Share on Pinterest" title="Share on Pinterest">
              <svg class="share-platform-icon" viewBox="0 0 64 64" fill="currentColor">
                <path d="M14.4,53.8c2.4,2,6.1,0.6,6.8-2.4l0-0.1c0.4-1.8,2.4-10.2,3.2-13.7c0.2-0.9,0.2-1.8-0.1-2.7 C24.2,34,24,32.8,24,31.5c0-4.1,2.4-7.2,5.4-7.2c2.5,0,3.8,1.9,3.8,4.2c0,2.6-1.6,6.4-2.5,9.9c-0.7,3,1.5,5.4,4.4,5.4 c5.3,0,8.9-6.8,8.9-14.9c0-6.1-4.1-10.7-11.6-10.7c-8.5,0-13.8,6.3-13.8,13.4c0,2.4,0.7,4.2,1.8,5.5c0.5,0.6,0.6,0.9,0.4,1.6 c-0.1,0.5-0.4,1.8-0.6,2.2c-0.2,0.7-0.8,1-1.4,0.7c-3.9-1.6-5.7-5.9-5.7-10.7c0-8,6.7-17.5,20-17.5c10.7,0,17.7,7.7,17.7,16 c0,11-6.1,19.2-15.1,19.2c-1.9,0-3.8-0.7-5.2-1.6c-0.9-0.6-2.1-0.1-2.4,0.9c-0.5,1.9-1.1,4.3-1.3,4.9c-0.1,0.5-0.3,0.9-0.4,1.4 c-1,2.7,0.9,5.5,3.7,5.7c2.1,0.1,4.2,0,6.3-0.3c12.4-2,22.1-12.2,23.4-24.7C61.5,18.1,48.4,4,32,4C16.5,4,4,16.5,4,32 C4,40.8,8.1,48.6,14.4,53.8z"></path>
              </svg>
            </button>
            <button type="button" class="share-platform-pill share-pill-linkedin" data-platform="linkedin" aria-label="Share on LinkedIn" title="Share on LinkedIn">
              <svg class="share-platform-icon" viewBox="0 0 64 64" fill="currentColor">
                <path d="M8,54.7C8,55.4,8.6,56,9.3,56h9.3c0.7,0,1.3-0.6,1.3-1.3V23.9c0-0.7-0.6-1.3-1.3-1.3H9.3 c-0.7,0-1.3,0.6-1.3,1.3V54.7z"></path>
                <path d="M46.6,22.3c-4.5,0-7.7,1.8-9.4,3.7c-0.4,0.4-1.1,0.1-1.1-0.5l0-1.6c0-0.7-0.6-1.3-1.3-1.3h-9.4 c-0.7,0-1.3,0.6-1.3,1.3c0.1,5.7,0,25.4,0,30.7c0,0.7,0.6,1.3,1.3,1.3h9.5c0.7,0,1.3-0.6,1.3-1.3V37.9c0-1,0-2,0.3-2.7 c0.8-2,2.6-4.1,5.7-4.1c4.1,0,6,3.1,6,7.6v15.9c0,0.7,0.6,1.3,1.3,1.3h9.3c0.7,0,1.3-0.6,1.3-1.3V37.4C60,27.1,54.1,22.3,46.6,22.3 z"></path>
                <path d="M13.9,18.9L13.9,18.9c3.8,0,6.1-2.4,6.1-5.4C19.9,10.3,17.7,8,14,8c-3.7,0-6,2.3-6,5.4 C8,16.5,10.3,18.9,13.9,18.9z"></path>
              </svg>
            </button>
            <button type="button" class="share-platform-pill share-pill-email" data-platform="email" aria-label="Share via Email" title="Share via Email">
              <svg class="share-platform-icon" viewBox="0 0 500 500" fill="currentColor">
                <path d="M468.051,222.657c0-12.724-5.27-24.257-13.717-32.527 L282.253,45.304c-17.811-17.807-46.702-17.807-64.505,0L45.666,190.129c-8.448,8.271-13.717,19.803-13.717,32.527v209.054 c0,20.079,16.264,36.341,36.34,36.341h363.421c20.078,0,36.34-16.262,36.34-36.341V222.657z M124.621,186.402h250.758 c11.081,0,19.987,8.905,19.987,19.991v34.523c-0.088,4.359-1.818,8.631-5.181,11.997l-55.966,56.419l83.224,83.127 c6.904,6.904,6.904,18.081,0,24.985s-18.085,6.904-24.985,0l-85.676-85.672H193.034l-85.492,85.672 c-6.907,6.904-18.081,6.904-24.985,0c-6.906-6.904-6.906-18.081,0-24.985l83.131-83.127l-55.875-56.419 c-3.638-3.638-5.363-8.358-5.181-13.177v-33.343C104.632,195.307,113.537,186.402,124.621,186.402z"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Border connecting from left to right -->
        <div class="share-modal-divider" role="separator" aria-hidden="true"></div>

        <!-- Section 3: Copy link showing the url -->
        <div class="share-copy-section">
          <span class="share-section-label">Copy link</span>
          <div class="share-copy-box">
            <svg class="share-link-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <g clip-path="url(#clip0_4418_9126)">
                <path d="M14.99 17.5H16.5C19.52 17.5 22 15.03 22 12C22 8.98 19.53 6.5 16.5 6.5H14.99" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M9 6.5H7.5C4.47 6.5 2 8.97 2 12C2 15.02 4.47 17.5 7.5 17.5H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M8 12H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </g>
              <defs>
                <clipPath id="clip0_4418_9126">
                  <rect width="24" height="24" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            <input
              type="text"
              class="share-url-input"
              id="share-url-input"
              readonly
              aria-label="Article shareable URL"
            />
            <button type="button" class="share-copy-btn" id="share-copy-btn" aria-label="Copy article link to clipboard" title="Copy link">
              <span class="share-copy-btn-icon" id="share-copy-btn-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const COPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

  let currentShareData = {
    title: '',
    description: '',
    image: '',
    url: ''
  };

  function ensureModalInDOM() {
    let overlay = document.getElementById('share-modal-overlay');
    if (!overlay) {
      const div = document.createElement('div');
      div.innerHTML = SHARE_MODAL_HTML.trim();
      overlay = div.firstElementChild;
      document.body.appendChild(overlay);
      initShareModalEvents(overlay);
    } else if (!overlay.hasAttribute('data-events-bound')) {
      initShareModalEvents(overlay);
    }
    return overlay;
  }

  function initShareModalEvents(overlay) {
    if (overlay.hasAttribute('data-events-bound')) return;
    overlay.setAttribute('data-events-bound', 'true');

    const closeBtn = document.getElementById('share-close-btn');
    const modal = document.getElementById('share-modal');
    const sheetHandle = document.getElementById('share-sheet-handle');
    const copyBtn = document.getElementById('share-copy-btn');
    const urlInput = document.getElementById('share-url-input');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeShareModal);
    }

    // Dismiss on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeShareModal();
      }
    });

    // Dismiss on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-active')) {
        closeShareModal();
      }
    });

    // Touch swipe down on mobile handle
    if (sheetHandle && modal) {
      let touchStartY = 0;
      let touchCurrentY = 0;

      sheetHandle.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      sheetHandle.addEventListener('touchmove', (e) => {
        touchCurrentY = e.touches[0].clientY;
        const diff = touchCurrentY - touchStartY;
        if (diff > 0) {
          modal.style.transform = `translate3d(0, ${diff}px, 0)`;
        }
      }, { passive: true });

      sheetHandle.addEventListener('touchend', () => {
        const diff = touchCurrentY - touchStartY;
        modal.style.transform = '';
        if (diff > 75) {
          closeShareModal();
        }
        touchStartY = 0;
        touchCurrentY = 0;
      });
    }

    // Platform Pills Click Handlers
    const pillsRow = document.getElementById('share-pills-row');
    if (pillsRow) {
      pillsRow.addEventListener('click', (e) => {
        const btn = e.target.closest('.share-platform-pill');
        if (!btn) return;
        const platform = btn.getAttribute('data-platform');
        handlePlatformShare(platform);
      });
    }

    // Copy URL Button (Big icon-only button)
    if (copyBtn && urlInput) {
      copyBtn.addEventListener('click', async () => {
        const urlToCopy = urlInput.value || window.location.href;
        let copied = false;
        try {
          await navigator.clipboard.writeText(urlToCopy);
          copied = true;
        } catch (err) {
          urlInput.select();
          try {
            document.execCommand('copy');
            copied = true;
          } catch (e) {}
        }

        if (copied) {
          const iconSpan = document.getElementById('share-copy-btn-icon');
          copyBtn.classList.add('is-copied');
          if (iconSpan) iconSpan.innerHTML = CHECK_SVG;

          if (window.RadiologyAuth && typeof window.RadiologyAuth.showToast === 'function') {
            window.RadiologyAuth.showToast('Link copied to clipboard', 'success');
          }

          setTimeout(() => {
            copyBtn.classList.remove('is-copied');
            if (iconSpan) iconSpan.innerHTML = COPY_SVG;
          }, 2200);
        }
      });
    }
  }

  function handlePlatformShare(platform) {
    const { title, description, url } = currentShareData;
    const shareText = title ? `${title} - ${description || ''}`.trim() : 'My Radiology Guide protocol';
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + '\n' + url)}`;
        break;
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(currentShareData.image || '')}&description=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText + '\n\n' + url)}`;
        break;
      default:
        return;
    }

    if (platform === 'email') {
      window.location.href = shareUrl;
    } else {
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=640,height=560');
    }
  }

  function openShareModal(options) {
    const overlay = ensureModalInDOM();

    // Resolve post title
    let title = options?.title || '';
    if (!title) {
      const titleEl = document.querySelector('.post-title') || document.getElementById('post-header-title') || document.querySelector('h1') || document.getElementById('pinned-title-link');
      title = titleEl ? titleEl.textContent.trim() : document.title;
    }

    // Resolve post description
    let description = options?.description || '';
    if (!description) {
      const descEl = document.querySelector('.post-lead-excerpt') || document.querySelector('.post-deck') || document.getElementById('pinned-post-desc') || document.querySelector('meta[name="description"]');
      if (descEl) {
        description = descEl.getAttribute('content') || descEl.textContent.trim();
      }
    }

    // Resolve image
    let image = options?.image || '';
    if (!image) {
      const imgEl = document.querySelector('.post-figure img') || document.querySelector('.pinned-image-box img') || document.querySelector('.carousel-slide.is-active img') || document.querySelector('meta[property="og:image"]');
      if (imgEl) {
        image = imgEl.getAttribute('src') || imgEl.getAttribute('content') || DEFAULT_IMAGE;
      } else {
        image = DEFAULT_IMAGE;
      }
    }

    // Resolve URL
    let url = options?.url || window.location.href;

    currentShareData = { title, description, image, url };

    // Update DOM
    const titleEl = document.getElementById('share-preview-title');
    const descEl = document.getElementById('share-preview-desc');
    const imgEl = document.getElementById('share-preview-img');
    const urlInput = document.getElementById('share-url-input');

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = description;
    if (imgEl) {
      imgEl.src = image;
      imgEl.alt = title;
    }
    if (urlInput) {
      urlInput.value = url;
    }

    overlay.classList.add('is-active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeShareModal() {
    const overlay = document.getElementById('share-modal-overlay');
    if (overlay) {
      overlay.classList.remove('is-active');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  }

  // Expose global methods
  window.openShareModal = openShareModal;
  window.closeShareModal = closeShareModal;

  // Auto-bind to share buttons on page load
  document.addEventListener('DOMContentLoaded', () => {
    ensureModalInDOM();

    // 1. Post page header share button
    const postShareBtn = document.getElementById('post-share-btn');
    if (postShareBtn) {
      postShareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openShareModal();
      });
    }

    // 2. Home page pinned post share button
    const pinnedShareBtn = document.getElementById('pinned-share-btn');
    if (pinnedShareBtn) {
      pinnedShareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const pinnedTitleEl = document.getElementById('pinned-title-link');
        const pinnedDescEl = document.getElementById('pinned-post-desc');
        const title = pinnedTitleEl ? pinnedTitleEl.textContent.trim() : 'Acute Ischemic Stroke: Multiphase CTA Collateral Atlas & ASPECTS Triage Protocol';
        const description = pinnedDescEl ? pinnedDescEl.textContent.trim() : 'Comprehensive acute neurovascular imaging pathway covering rapid collateral grading, early ischemic core mapping, and standardized acute triage.';
        const url = window.location.origin + '/post/?id=neuroradiology-stroke-cta';
        const image = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80';
        openShareModal({ title, description, url, image });
      });
    }

    // 3. Delegated listener for any share trigger across the DOM
    document.addEventListener('click', (e) => {
      const shareTrigger = e.target.closest('#post-share-btn, #pinned-share-btn, [data-action="share"], .share-trigger');
      if (shareTrigger && !e.defaultPrevented) {
        e.preventDefault();
        openShareModal();
      }
    });
  });

})();
