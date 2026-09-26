/**
 * post.js
 * Logic for Post Page interactions:
 * - Bookmark/Save action
 * - Share and copy link
 * - Reading time dynamic counter / Reading progress
 */

(function () {
  'use strict';

  const STORAGE_KEY_SAVED = 'radiology_saved_posts';

  const SVG_SAVE_PLUS = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
    <g clip-path="url(#clip0_4418_9959)">
      <path d="M14.5 10.6504H9.5" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M12 8.21094V13.2109" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M16.8199 2H7.17995C5.04995 2 3.31995 3.74 3.31995 5.86V19.95C3.31995 21.75 4.60995 22.51 6.18995 21.64L11.0699 18.93C11.5899 18.64 12.4299 18.64 12.9399 18.93L17.8199 21.64C19.3999 22.52 20.6899 21.76 20.6899 19.95V5.86C20.6799 3.74 18.9499 2 16.8199 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
    <defs>
      <clipPath id="clip0_4418_9959">
        <rect width="24" height="24" fill="white"/>
      </clipPath>
    </defs>
  </svg>`;

  const SVG_SAVE_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
    <g clip-path="url(#clip0_4418_9959_chk)">
      <path d="M9 11.5L11 13.5L15 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16.8199 2H7.17995C5.04995 2 3.31995 3.74 3.31995 5.86V19.95C3.31995 21.75 4.60995 22.51 6.18995 21.64L11.0699 18.93C11.5899 18.64 12.4299 18.64 12.9399 18.93L17.8199 21.64C19.3999 22.52 20.6899 21.76 20.6899 19.95V5.86C20.6799 3.74 18.9499 2 16.8199 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
    <defs>
      <clipPath id="clip0_4418_9959_chk">
        <rect width="24" height="24" fill="white"/>
      </clipPath>
    </defs>
  </svg>`;

  function initPostActions() {
    const saveBtn = document.getElementById('post-save-btn');
    const saveIcon = document.getElementById('post-save-icon');
    const saveText = document.getElementById('post-save-text');
    const shareBtn = document.getElementById('post-share-btn');
    const shareText = document.getElementById('post-share-text');

    const postId = 'stroke-cta-protocol';

    // Read saved status
    let savedList = [];
    try {
      savedList = JSON.parse(localStorage.getItem(STORAGE_KEY_SAVED) || '[]');
    } catch (e) {
      savedList = [];
    }

    let isSaved = savedList.includes(postId);
    updateSaveUI(isSaved);

    function updateSaveUI(saved) {
      if (!saveBtn) return;
      if (saved) {
        saveBtn.classList.add('is-active');
        saveBtn.setAttribute('aria-pressed', 'true');
        saveBtn.setAttribute('title', 'Saved');
        if (saveText) saveText.textContent = '';
        if (saveIcon) saveIcon.innerHTML = SVG_SAVE_CHECK;
      } else {
        saveBtn.classList.remove('is-active');
        saveBtn.setAttribute('aria-pressed', 'false');
        saveBtn.setAttribute('title', 'Save');
        if (saveText) saveText.textContent = '';
        if (saveIcon) saveIcon.innerHTML = SVG_SAVE_PLUS;
      }
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        isSaved = !isSaved;
        try {
          let list = JSON.parse(localStorage.getItem(STORAGE_KEY_SAVED) || '[]');
          if (isSaved) {
            if (!list.includes(postId)) list.push(postId);
          } else {
            list = list.filter((id) => id !== postId);
          }
          localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(list));
        } catch (e) {}
        updateSaveUI(isSaved);
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const shareUrl = window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({
              title: document.title,
              url: shareUrl,
            });
            return;
          } catch (e) {}
        }

        try {
          await navigator.clipboard.writeText(shareUrl);
          shareBtn.setAttribute('title', 'Link Copied!');
          shareBtn.classList.add('is-active');
          setTimeout(() => {
            shareBtn.setAttribute('title', 'Share');
            shareBtn.classList.remove('is-active');
          }, 2000);
        } catch (e) {}
      });
    }
  }

  /**
   * Interactive Tabs
   */
  function initPostTabs() {
    const tabContainers = document.querySelectorAll('.post-tabs');
    tabContainers.forEach((container) => {
      const btns = container.querySelectorAll('.post-tab-btn');
      const panels = container.querySelectorAll('.post-tab-panel');

      btns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-tab');

          btns.forEach((b) => b.classList.remove('is-active'));
          panels.forEach((p) => p.classList.remove('is-active'));

          btn.classList.add('is-active');
          const activePanel = container.querySelector(`#${targetId}`);
          if (activePanel) {
            activePanel.classList.add('is-active');
          }
        });
      });
    });
  }

  /**
   * Code Block Copy Buttons
   */
  function initCodeCopy() {
    const copyBtns = document.querySelectorAll('.code-copy-btn');
    copyBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-target');
        const codeElement = targetId ? document.getElementById(targetId) : btn.closest('.post-code-block')?.querySelector('pre code');
        if (!codeElement) return;

        const textToCopy = codeElement.innerText;
        try {
          await navigator.clipboard.writeText(textToCopy);
          const originalHTML = btn.innerHTML;
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
          btn.style.borderColor = 'var(--accent-color)';
          btn.style.color = 'var(--accent-color)';
          setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.borderColor = '';
            btn.style.color = '';
          }, 2000);
        } catch (e) {}
      });
    });
  }

  /**
   * Interactive Checklist
   */
  function initChecklist() {
    const checklistItems = document.querySelectorAll('.post-checklist li');
    checklistItems.forEach((item) => {
      const checkbox = item.querySelector('.post-checklist-checkbox');
      item.addEventListener('click', (e) => {
        if (e.target !== checkbox && checkbox) {
          checkbox.checked = !checkbox.checked;
        }
        if (checkbox && checkbox.checked) {
          item.style.opacity = '0.7';
          item.style.textDecoration = 'line-through';
        } else {
          item.style.opacity = '1';
          item.style.textDecoration = 'none';
        }
      });
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            item.style.opacity = '0.7';
            item.style.textDecoration = 'line-through';
          } else {
            item.style.opacity = '1';
            item.style.textDecoration = 'none';
          }
        });
      }
    });
  }

  /**
   * Smooth Scroll for TOC & In-Page Anchors
   */
  function initSmoothScroll() {
    document.querySelectorAll('.post-toc-link, .post-citation, .post-footnote-backref').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#')) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.pushState(null, '', href);
          }
        }
      });
    });
  }

  /**
   * KaTeX Math & Formula Rendering and LaTeX Copy Functionality
   */
  function initMathAndChem() {
    function renderAllFormulas() {
      // 1. Direct KaTeX rendering for targeted display formula blocks
      if (typeof window.katex !== 'undefined' && typeof window.katex.render === 'function') {
        document.querySelectorAll('.post-formula-math[data-latex]').forEach((el) => {
          const latex = el.getAttribute('data-latex');
          if (latex) {
            try {
              window.katex.render(latex, el, {
                displayMode: true,
                throwOnError: false,
                output: 'htmlAndMathml'
              });
            } catch (err) {
              console.warn('KaTeX render error:', err);
            }
          }
        });

        // 2. Direct KaTeX rendering for inline expressions
        document.querySelectorAll('.katex-inline[data-latex]').forEach((el) => {
          const latex = el.getAttribute('data-latex');
          if (latex) {
            try {
              window.katex.render(latex, el, {
                displayMode: false,
                throwOnError: false,
                output: 'htmlAndMathml'
              });
            } catch (err) {
              console.warn('KaTeX inline render error:', err);
            }
          }
        });
      }

      // 3. Auto-render remaining delimiters across post prose
      if (typeof window.renderMathInElement === 'function') {
        const prose = document.querySelector('.post-prose') || document.body;
        try {
          window.renderMathInElement(prose, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\[', right: '\\]', display: true },
              { left: '\\(', right: '\\)', display: false }
            ],
            throwOnError: false,
            ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
          });
        } catch (e) {
          console.warn('KaTeX auto-render error:', e);
        }
      }
    }

    // Try rendering on load and with retries if scripts are deferred
    if (typeof window.katex !== 'undefined' || typeof window.renderMathInElement === 'function') {
      renderAllFormulas();
    } else {
      window.addEventListener('load', renderAllFormulas);
      setTimeout(renderAllFormulas, 200);
      setTimeout(renderAllFormulas, 800);
      setTimeout(renderAllFormulas, 2000);
    }

    // 4. Formula LaTeX Copy Interaction
    const copySVG = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>LaTeX</span>`;
    const checkSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span style="color:var(--color-success,#16a34a)">Copied!</span>`;

    document.querySelectorAll('.formula-copy-btn').forEach((btn) => {
      btn.addEventListener('click', async function () {
        const latex = this.getAttribute('data-latex') || '';
        if (!latex) return;

        try {
          await navigator.clipboard.writeText(latex);
          this.innerHTML = checkSVG;
          this.classList.add('is-copied');

          setTimeout(() => {
            this.innerHTML = copySVG;
            this.classList.remove('is-copied');
          }, 2000);
        } catch (err) {
          // Fallback textarea copy
          const textarea = document.createElement('textarea');
          textarea.value = latex;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            this.innerHTML = checkSVG;
            this.classList.add('is-copied');
            setTimeout(() => {
              this.innerHTML = copySVG;
              this.classList.remove('is-copied');
            }, 2000);
          } catch (e) {
            console.error('Failed to copy LaTeX:', e);
          }
          document.body.removeChild(textarea);
        }
      });
    });
  }

  function init() {
    initPostActions();
    initPostTabs();
    initCodeCopy();
    initChecklist();
    initSmoothScroll();
    initMathAndChem();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
