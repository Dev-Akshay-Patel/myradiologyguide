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

    // Read saved status from RadiologyAuth (Cookie-based)
    let isSaved = false;
    if (window.RadiologyAuth && typeof window.RadiologyAuth.isBookmarked === 'function') {
      isSaved = window.RadiologyAuth.isBookmarked(postId);
    } else {
      try {
        const savedList = JSON.parse(localStorage.getItem(STORAGE_KEY_SAVED) || '[]');
        isSaved = savedList.includes(postId);
      } catch (e) {
        isSaved = false;
      }
    }
    updateSaveUI(isSaved);

    function updateSaveUI(saved) {
      if (!saveBtn) return;
      if (saved) {
        saveBtn.classList.add('is-active');
        saveBtn.setAttribute('aria-pressed', 'true');
        saveBtn.setAttribute('title', 'Saved to Bookmarks (Cookie)');
        if (saveText) saveText.textContent = '';
        if (saveIcon) saveIcon.innerHTML = SVG_SAVE_CHECK;
      } else {
        saveBtn.classList.remove('is-active');
        saveBtn.setAttribute('aria-pressed', 'false');
        saveBtn.setAttribute('title', 'Save to Bookmarks');
        if (saveText) saveText.textContent = '';
        if (saveIcon) saveIcon.innerHTML = SVG_SAVE_PLUS;
      }
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (window.RadiologyAuth && typeof window.RadiologyAuth.toggleBookmark === 'function') {
          isSaved = window.RadiologyAuth.toggleBookmark(postId);
          updateSaveUI(isSaved);
          if (window.RadiologyAuth.showToast) {
            window.RadiologyAuth.showToast(isSaved ? 'Saved to bookmarks' : 'Removed from bookmarks', isSaved ? 'success' : 'info');
          }
        } else {
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
        }
      });
    }

    window.addEventListener('bookmarks-updated', () => {
      if (window.RadiologyAuth) {
        isSaved = window.RadiologyAuth.isBookmarked(postId);
        updateSaveUI(isSaved);
      }
    });

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (typeof window.openShareModal === 'function') {
          window.openShareModal();
        }
      });
    }

    const commentBtn = document.getElementById('post-comment-btn');
    if (commentBtn) {
      commentBtn.addEventListener('click', () => {
        if (typeof window.openCommentsModal === 'function') {
          window.openCommentsModal();
        }
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
    const copySVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 12.9V17.1C16 20.6 14.6 22 11.1 22H6.9C3.4 22 2 20.6 2 17.1V12.9C2 9.4 3.4 8 6.9 8H11.1C14.6 8 16 9.4 16 12.9Z"></path><path d="M22 6.9V11.1C22 14.6 20.6 16 17.1 16H16V12.9C16 9.4 14.6 8 11.1 8H8V6.9C8 3.4 9.4 2 12.9 2H17.1C20.6 2 22 3.4 22 6.9Z"></path></svg>`;
    const checkSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.1V6.9C22 3.4 20.6 2 17.1 2H12.9C9.4 2 8 3.4 8 6.9V8H11.1C14.6 8 16 9.4 16 12.9V16H17.1C20.6 16 22 14.6 22 11.1Z"></path><path d="M16 17.1V12.9C16 9.4 14.6 8 11.1 8H6.9C3.4 8 2 9.4 2 12.9V17.1C2 20.6 3.4 22 6.9 22H11.1C14.6 22 16 20.6 16 17.1Z"></path><path d="M6.08008 15.0008L8.03008 16.9508L11.9201 13.0508"></path></svg>`;

    const copyBtns = document.querySelectorAll('.code-copy-btn');
    copyBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-target');
        const codeElement = targetId ? document.getElementById(targetId) : btn.closest('.post-code-block')?.querySelector('pre code');
        if (!codeElement) return;

        const textToCopy = codeElement.innerText;
        try {
          await navigator.clipboard.writeText(textToCopy);
          btn.innerHTML = checkSVG;
          btn.classList.add('is-copied');
          setTimeout(() => {
            btn.innerHTML = copySVG;
            btn.classList.remove('is-copied');
          }, 2000);
        } catch (e) {
          try {
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            btn.innerHTML = checkSVG;
            btn.classList.add('is-copied');
            setTimeout(() => {
              btn.innerHTML = copySVG;
              btn.classList.remove('is-copied');
            }, 2000);
            document.body.removeChild(textarea);
          } catch (err) {}
        }
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
    const copySVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 12.9V17.1C16 20.6 14.6 22 11.1 22H6.9C3.4 22 2 20.6 2 17.1V12.9C2 9.4 3.4 8 6.9 8H11.1C14.6 8 16 9.4 16 12.9Z"></path><path d="M22 6.9V11.1C22 14.6 20.6 16 17.1 16H16V12.9C16 9.4 14.6 8 11.1 8H8V6.9C8 3.4 9.4 2 12.9 2H17.1C20.6 2 22 3.4 22 6.9Z"></path></svg>`;
    const checkSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.1V6.9C22 3.4 20.6 2 17.1 2H12.9C9.4 2 8 3.4 8 6.9V8H11.1C14.6 8 16 9.4 16 12.9V16H17.1C20.6 16 22 14.6 22 11.1Z"></path><path d="M16 17.1V12.9C16 9.4 14.6 8 11.1 8H6.9C3.4 8 2 9.4 2 12.9V17.1C2 20.6 3.4 22 6.9 22H11.1C14.6 22 16 20.6 16 17.1Z"></path><path d="M6.08008 15.0008L8.03008 16.9508L11.9201 13.0508"></path></svg>`;

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

  /**
   * Comments & Discussion Modal / Bottom Sheet System
   */
  function initCommentsModal() {
    const overlay = document.getElementById('comments-modal-overlay');
    const modal = document.getElementById('comments-modal');
    const closeBtn = document.getElementById('comments-close-btn');
    const commentsListEl = document.getElementById('comments-list');
    const countBadge = document.getElementById('comments-count-badge');
    const commentForm = document.getElementById('comment-form');
    const commentInput = document.getElementById('comment-input');
    const commentPostPill = document.getElementById('comment-post-pill');
    const commentCurrentAvatarEl = document.getElementById('comment-current-avatar');
    const replyingBanner = document.getElementById('comment-replying-banner');
    const replyingToName = document.getElementById('replying-to-name');
    const cancelReplyBtn = document.getElementById('cancel-reply-btn');
    const sheetHandle = document.getElementById('comments-sheet-handle');

    if (!overlay || !commentsListEl || !commentForm) return;

    // State
    let comments = [];
    let activeReplyTarget = null; // { parentId: string, replyToAuthor: string, isReplyToReply: boolean }
    let expandedReplyIds = new Set(); // Replies hidden by default

    function adjustTextareaHeight() {
      if (!commentInput) return;
      commentInput.style.height = 'auto';
      const newHeight = Math.min(Math.max(commentInput.scrollHeight, 38), 140);
      commentInput.style.height = newHeight + 'px';
    }

    function updatePostPillVisibility() {
      if (!commentPostPill || !commentInput) return;
      const hasText = commentInput.value.trim().length > 0;
      commentPostPill.disabled = !hasText;
      commentPostPill.classList.toggle('is-visible', hasText);
    }

    // Helper to get self-hosted DiceBear avatar data URI
    function getDicebearAvatar(seed) {
      if (typeof window !== 'undefined' && window.DiceBear && typeof window.DiceBear.getRandomAvatar === 'function') {
        return window.DiceBear.getRandomAvatar(seed);
      }
      return null;
    }

    // Returns avatar HTML markup: if user has avatarUrl, renders it; if user doesn't have a profile image, randomizes with DiceBear!
    function getAvatarMarkup(item, cssClass = '') {
      let avatarUrl = item.avatarUrl;
      if (!avatarUrl) {
        avatarUrl = getDicebearAvatar(item.author || item.id || 'radiology-user');
      }

      if (avatarUrl) {
        return `<div class="comment-avatar ${cssClass}" title="${escapeHtml(item.author || 'User')}"><img class="comment-avatar-img" src="${avatarUrl}" alt="${escapeHtml(item.author || 'User')}" loading="lazy" /></div>`;
      }
      return `<div class="comment-avatar ${cssClass}" style="background-color: ${item.avatarBg || '#0891b2'};">${escapeHtml(item.avatarText || 'MD')}</div>`;
    }

    function getActiveUser() {
      // 1. Firebase Auth current user
      if (window.MRGFirebaseComments && typeof window.MRGFirebaseComments.getFirebaseAuth === 'function') {
        const auth = window.MRGFirebaseComments.getFirebaseAuth();
        if (auth && auth.currentUser) {
          const u = auth.currentUser;
          return {
            isLoggedIn: true,
            isGoogle: true,
            name: u.displayName || (u.email ? u.email.split('@')[0] : 'Clinician'),
            email: u.email || '',
            avatar: u.photoURL || null,
            uid: u.uid
          };
        }
      }

      // 2. RadiologyAuth session
      if (window.RadiologyAuth && typeof window.RadiologyAuth.getSession === 'function') {
        const s = window.RadiologyAuth.getSession();
        if (s && (s.email || s.uid || (s.name && s.name !== 'Workspace' && s.name !== 'You' && s.name !== 'Anonymous'))) {
          return {
            isLoggedIn: true,
            isGoogle: s.provider === 'google' || !s.isLocal,
            name: s.name || (s.email ? s.email.split('@')[0] : 'Clinician'),
            email: s.email || '',
            avatar: s.avatar || null,
            uid: s.uid || undefined
          };
        }
      }

      // 3. LocalStorage session
      try {
        const raw = localStorage.getItem('my_radiology_user_session');
        if (raw) {
          const s = JSON.parse(raw);
          if (s && (s.email || s.uid || (s.name && s.name !== 'Workspace' && s.name !== 'You' && s.name !== 'Anonymous'))) {
            return {
              isLoggedIn: true,
              isGoogle: s.provider === 'google' || !s.isLocal,
              name: s.name || (s.email ? s.email.split('@')[0] : 'Clinician'),
              email: s.email || '',
              avatar: s.avatar || null,
              uid: s.uid || undefined
            };
          }
        }
      } catch (e) {}

      // 4. Local Profile
      try {
        const rawProf = localStorage.getItem('radiology_local_profile');
        if (rawProf) {
          const p = JSON.parse(rawProf);
          if (p && p.name && p.name.trim() && p.name !== 'Dr. Alex Morgan' && p.name !== 'Akshay Patel') {
            return {
              isLoggedIn: true,
              isGoogle: false,
              name: p.name.trim(),
              email: '',
              avatar: p.avatar || null,
              uid: undefined
            };
          }
        }
      } catch (e) {}

      return {
        isLoggedIn: false,
        isGoogle: false,
        name: null,
        email: null,
        avatar: null,
        uid: null
      };
    }

    function updateCurrentAvatarUI() {
      if (!commentCurrentAvatarEl) return;
      const user = getActiveUser();
      const signedIn = user.isLoggedIn;
      const userName = user.name || 'You';
      let currentAvatar = user.avatar;

      // If user doesn't have a profile image, randomize with DiceBear
      if (!currentAvatar) {
        let guestAvatar = null;
        try {
          guestAvatar = localStorage.getItem('my_radiology_user_avatar');
        } catch (e) {}
        if (!guestAvatar) {
          guestAvatar = getDicebearAvatar('user-' + Math.random().toString(36).substring(2, 9));
          if (guestAvatar) {
            try {
              localStorage.setItem('my_radiology_user_avatar', guestAvatar);
            } catch (e) {}
          }
        }
        currentAvatar = guestAvatar;
      }

      if (currentAvatar) {
        commentCurrentAvatarEl.innerHTML = `<img class="comment-current-avatar-img" src="${currentAvatar}" alt="${escapeHtml(userName)}" />`;
      } else {
        const initials = userName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase() || 'CL';
        commentCurrentAvatarEl.innerHTML = `<span>${escapeHtml(initials)}</span>`;
      }

      // Check if user is authenticated -> Hide restriction if signed in!
      const restrictionEl = document.getElementById('comment-local-restriction');
      if (restrictionEl) {
        restrictionEl.classList.toggle('is-hidden', signedIn);
      }
      const restrictionLoginBtn = document.getElementById('btn-restriction-google-login');
      if (restrictionLoginBtn && !restrictionLoginBtn.hasAttribute('data-bound')) {
        restrictionLoginBtn.setAttribute('data-bound', 'true');
        restrictionLoginBtn.addEventListener('click', async () => {
          if (window.MRGFirebaseComments && typeof window.MRGFirebaseComments.signInWithGoogle === 'function') {
            const res = await window.MRGFirebaseComments.signInWithGoogle();
            if (res && res.success) {
              updateCurrentAvatarUI();
              if (commentInput) {
                commentInput.disabled = false;
                commentInput.focus();
              }
              return;
            }
          }
          if (window.RadiologyAuth && typeof window.RadiologyAuth.signInWithGoogle === 'function') {
            await window.RadiologyAuth.signInWithGoogle();
            updateCurrentAvatarUI();
          } else {
            window.location.href = '../login/index.html';
          }
        });
      }
      if (commentInput) {
        if (!signedIn) {
          commentInput.disabled = true;
          commentInput.placeholder = 'Sign in with Google to comment.';
        } else {
          commentInput.disabled = false;
          if (!activeReplyTarget) {
            commentInput.placeholder = 'Add to the discussion...';
          }
        }
      }
      if (commentPostPill && !signedIn) {
        commentPostPill.disabled = true;
        commentPostPill.classList.remove('is-visible');
      }
    }

    window.addEventListener('auth-state-changed', updateCurrentAvatarUI);
    if (window.MRGFirebaseComments && typeof window.MRGFirebaseComments.initAuthObserver === 'function') {
      window.MRGFirebaseComments.initAuthObserver(() => {
        updateCurrentAvatarUI();
      });
    }

    if (commentCurrentAvatarEl) {
      commentCurrentAvatarEl.addEventListener('click', () => {
        const newSeed = 'user-' + Math.random().toString(36).substring(2, 10);
        const newAvatar = getDicebearAvatar(newSeed);
        if (!newAvatar) return;

        try {
          localStorage.setItem('my_radiology_user_avatar', newAvatar);
          const raw = localStorage.getItem('my_radiology_user_session');
          if (raw) {
            const session = JSON.parse(raw);
            session.avatar = newAvatar;
            session.isDicebear = true;
            localStorage.setItem('my_radiology_user_session', JSON.stringify(session));
          }
        } catch (e) {}

        commentCurrentAvatarEl.classList.remove('is-spinning');
        void commentCurrentAvatarEl.offsetWidth;
        commentCurrentAvatarEl.innerHTML = `<img class="comment-current-avatar-img" src="${newAvatar}" alt="You" />`;
        commentCurrentAvatarEl.classList.add('is-spinning');
      });
    }

    if (commentInput) {
      const handleInputChange = () => {
        adjustTextareaHeight();
        updatePostPillVisibility();
      };

      commentInput.addEventListener('input', handleInputChange);
      commentInput.addEventListener('keyup', handleInputChange);
      commentInput.addEventListener('change', handleInputChange);
      commentInput.addEventListener('paste', () => {
        setTimeout(handleInputChange, 10);
      });

      commentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (commentInput.value.trim().length > 0) {
            commentForm.dispatchEvent(new Event('submit', { cancelable: true }));
          }
        }
      });

      updatePostPillVisibility();
    }

    // Initialize current user avatar UI
    updateCurrentAvatarUI();

    const STORAGE_COMMENTS_KEY = 'mrg_post_comments_v8';

    // Cleaned @ icon SVG
    const AT_RATE_SVG = `<svg class="comment-at-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M16.5485 20.9074C16.7993 21.3985 16.6058 22.0046 16.0939 22.2098C13.9858 23.0552 11.6589 23.2302 9.43437 22.6966C6.885 22.0852 4.63785 20.5833 3.09784 18.4616C1.55783 16.3399 0.82623 13.7379 1.03488 11.1246C1.24352 8.51121 2.37869 6.0583 4.23584 4.20784C6.09298 2.35738 8.54997 1.23105 11.1641 1.03182C13.7782 0.832594 16.3775 1.57356 18.4936 3.12121C20.6097 4.66885 22.1035 6.9214 22.7058 9.47296C22.9026 10.3069 23 11.1549 23 12L23 12.0022C22.9999 12.5715 22.9555 13.1396 22.8676 13.7012C22.5877 15.7731 21.7158 19 19 19C16.6669 19 15.889 17.6669 15.6297 16.778C14.6219 17.5448 13.3641 18 12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 12 18 14 17.9985 16C18 17 18.5 17 18.5 17C19.427 17 20.0112 16.2367 20.3791 15.3067C20.3882 15.2749 20.3987 15.2434 20.4106 15.2122C20.4524 15.1026 20.4921 14.9924 20.5296 14.8815C20.9613 13.5182 21 12 21 12H21.0031C21.0031 11.3083 20.9234 10.6143 20.7623 9.93171C20.2694 7.84334 19.0467 5.99971 17.3148 4.73301C15.5828 3.46632 13.4554 2.85986 11.3158 3.02292C9.17626 3.18599 7.1653 4.10785 5.64529 5.62239C4.12529 7.13693 3.19619 9.14455 3.02542 11.2835C2.85465 13.4224 3.45343 15.5521 4.71388 17.2886C5.97433 19.0251 7.81354 20.2544 9.90012 20.7548C11.6616 21.1773 13.5015 21.057 15.1819 20.4221C15.6977 20.2273 16.2977 20.4164 16.5485 20.9074ZM7.99803 12C7.99803 14.2102 9.78977 16.002 12 16.002C14.2102 16.002 16.002 14.2102 16.002 12C16.002 9.78978 14.2102 7.99803 12 7.99803C9.78977 7.99803 7.99803 9.78978 7.99803 12Z"/></svg>`;

    // Delete comment SVG (from user specification)
    const DELETE_COMMENT_SVG = `<svg class="comment-delete-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
<g clip-path="url(#clip0_del)">
<path d="M21 5.98047C17.67 5.65047 14.32 5.48047 10.98 5.48047C9 5.48047 7.02 5.58047 5.04 5.78047L3 5.98047" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
<path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
<path d="M18.85 9.14062L18.2 19.2106C18.09 20.7806 18 22.0006 15.21 22.0006H8.79002C6.00002 22.0006 5.91002 20.7806 5.80002 19.2106L5.15002 9.14062" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
<path d="M10.33 16.5H13.66" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
<path d="M9.5 12.5H14.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
</g>
<defs>
<clipPath id="clip0_del">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>
</svg>`;

    const KNOWN_DUMMY_IDS = new Set(['c-1', 'c-2', 'c-3', 'r-1-1', 'r-1-2', 'r-2-1']);
    const KNOWN_DUMMY_AUTHORS = new Set([
      'Dr. Aris Thorne',
      'Elena Rostova, MD',
      'Dr. Kenji Sato',
      'Sarah Jenkins, RT(R)(CT)',
      'Marcus Vance, PhD',
      'Clinical Editorial Team',
      'Akshay Patel'
    ]);

    function isCleanComment(c) {
      if (!c || !c.id) return false;
      if (KNOWN_DUMMY_IDS.has(c.id)) return false;
      if (KNOWN_DUMMY_AUTHORS.has(c.author)) return false;
      return true;
    }

    // Load persisted comments and purge any legacy dummy comments (Clean real data only)
    try {
      const storedComments = localStorage.getItem(STORAGE_COMMENTS_KEY);
      if (storedComments) {
        const parsed = JSON.parse(storedComments);
        if (Array.isArray(parsed)) {
          comments = parsed.filter(isCleanComment);
        } else {
          comments = [];
        }
      } else {
        comments = [];
      }
      localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(comments));
    } catch (e) {
      comments = [];
    }

    function saveComments() {
      try {
        localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(comments));
      } catch (e) {}
    }

    // Lazy one-time fetch with in-memory TTL caching (least minimum Firestore read usage)
    async function loadComments() {
      renderComments(); // Immediate local render

      if (window.MRGFirebaseComments && typeof window.MRGFirebaseComments.fetchComments === 'function') {
        try {
          const remoteList = await window.MRGFirebaseComments.fetchComments();
          if (Array.isArray(remoteList)) {
            comments = remoteList.filter(isCleanComment);
            saveComments();
            renderComments();
          }
        } catch (err) {
          console.warn('[Comments] Remote fetch notice:', err);
        }
      }
    }

    // Relative Time Formatter ("1h ago", "35m ago", "just now", "yesterday", "2d ago")
    function formatTimeAgo(ts) {
      if (!ts) return 'just now';
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - ts) / 1000));
      if (diffSec < 60) return 'just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays === 1) return 'yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      const diffWeeks = Math.floor(diffDays / 7);
      if (diffWeeks < 4) return `${diffWeeks}w ago`;
      return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Rich comment text formatter: supports breaks, auto-links, markdown links, bold, italic, strikethrough, inline code
    function formatCommentText(rawText) {
      if (!rawText) return '';
      let text = escapeHtml(rawText);

      // Token storage so formatting syntax isn't applied inside links or code
      const tokens = [];
      function addToken(html) {
        const placeholder = `\x01TOKEN_${tokens.length}\x02`;
        tokens.push(html);
        return placeholder;
      }

      // Inline code: `code`
      text = text.replace(/`([^`\n]+)`/g, (_m, code) => {
        return addToken(`<code class="comment-code-inline">${code}</code>`);
      });

      // Markdown links: [label](url)
      text = text.replace(/\[([^\]\n]+)\]\(((?:https?:\/\/|www\.)[^\s\)\"\'<>]+)\)/gi, (_m, label, url) => {
        const href = url.toLowerCase().startsWith('www.') ? `https://${url}` : url;
        return addToken(`<a href="${href}" target="_blank" rel="noopener noreferrer" class="comment-text-link">${label}</a>`);
      });

      // Raw URLs: https://... or http://... or www....
      text = text.replace(/(^|[\s\(\[\{])((?:https?:\/\/|www\.)[^\s\)\"\'<>\],]+)/gi, (_m, prefix, url) => {
        const href = url.toLowerCase().startsWith('www.') ? `https://${url}` : url;
        return prefix + addToken(`<a href="${href}" target="_blank" rel="noopener noreferrer" class="comment-text-link">${url}</a>`);
      });

      // Bold + Italic: ***text***, ___text___, **_text_**
      text = text.replace(/\*\*\*([^\*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
      text = text.replace(/___([^_\n]+)___/g, '<strong><em>$1</em></strong>');
      text = text.replace(/\*\*\_([^\*\_\n]+)\_\*\*/g, '<strong><em>$1</em></strong>');

      // Bold: **text** or __text__
      text = text.replace(/\*\*([^\*\n]+)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');

      // Strikethrough: ~~text~~ or ~text~
      text = text.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
      text = text.replace(/~([^~\n]+)~/g, '<del>$1</del>');

      // Italic: *text* or _text_
      text = text.replace(/\*([^\*\n]+)\*/g, '<em>$1</em>');
      text = text.replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.,!?:;])/g, '$1<em>$2</em>');

      // Restore protected tokens
      tokens.forEach((html, i) => {
        const placeholder = `\x01TOKEN_${i}\x02`;
        text = text.replace(placeholder, html);
      });

      // Line breaks
      text = text.replace(/\r\n|\r|\n/g, '<br>');

      return text;
    }

    function getTotalCommentsCount() {
      let count = 0;
      comments.forEach((c) => {
        count += 1;
        if (Array.isArray(c.replies)) {
          count += c.replies.length;
        }
      });
      return count;
    }

    function updateCountBadge() {
      if (countBadge) {
        countBadge.textContent = String(getTotalCommentsCount());
      }
    }

    // Render nested replies: full size like parent, with @ Name pill if replying to a reply
    function renderReplies(replies, parentId, isExpanded = false) {
      if (!replies || replies.length === 0) return '';
      return `
        <div class="comment-replies-list ${isExpanded ? 'is-expanded' : ''}" id="replies-${parentId}" role="group" aria-label="Replies">
          ${replies.map((r) => {
            return `
              <div class="comment-reply-item" id="comment-${r.id}" data-id="${r.id}" data-parent-id="${parentId}">
                ${getAvatarMarkup(r, 'avatar-reply')}
                <div class="comment-main-content">
                  <div class="comment-meta-row">
                    <span class="comment-author-name">${escapeHtml(r.author)}</span>
                    <time class="comment-timestamp">${formatTimeAgo(r.timestamp)}</time>
                  </div>
                  <div class="comment-body-text">${r.mention ? `<span class="comment-mention-pill">${AT_RATE_SVG}<span class="comment-mention-name">${escapeHtml(r.mention)}</span></span> ` : ''}${formatCommentText(r.text)}</div>
                  <div class="comment-actions-row">
                    <div class="comment-actions-left">
                      <button type="button" class="comment-action-link comment-reply-btn" data-parent-id="${parentId}" data-author="${escapeHtml(r.author)}" data-is-reply="true">
                        Reply
                      </button>
                    </div>
                    <button type="button" class="comment-delete-btn" data-id="${r.id}" data-parent-id="${parentId}" aria-label="Delete reply" title="Delete reply">
                      ${DELETE_COMMENT_SVG}
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // Render entire comments stream without tags or likes
    function renderComments() {
      updateCountBadge();

      if (!comments || comments.length === 0) {
        commentsListEl.innerHTML = `
          <div class="comments-empty-state">
            <svg class="comments-empty-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <div class="comments-empty-title">No comments yet</div>
            <div class="comments-empty-desc">Be the first to share clinical feedback or ask questions about this protocol.</div>
          </div>
        `;
        return;
      }

      commentsListEl.innerHTML = comments.map((c) => {
        const hasReplies = Array.isArray(c.replies) && c.replies.length > 0;
        const isExpanded = expandedReplyIds.has(c.id);
        const replyCount = hasReplies ? c.replies.length : 0;
        return `
          <article class="comment-item" id="comment-${c.id}" data-id="${c.id}">
            ${getAvatarMarkup(c)}
            <div class="comment-main-content">
              <div class="comment-meta-row">
                <span class="comment-author-name">${escapeHtml(c.author)}</span>
                <time class="comment-timestamp">${formatTimeAgo(c.timestamp)}</time>
              </div>
              <div class="comment-body-text">${formatCommentText(c.text)}</div>
              <div class="comment-actions-row">
                <div class="comment-actions-left">
                  <button type="button" class="comment-action-link comment-reply-btn" data-parent-id="${c.id}" data-author="${escapeHtml(c.author)}">
                    Reply
                  </button>
                  ${hasReplies ? `
                    <button type="button" class="comment-action-link comment-toggle-replies-btn ${isExpanded ? 'is-expanded' : ''}" data-parent-id="${c.id}" aria-expanded="${isExpanded ? 'true' : 'false'}">
                      <span>${isExpanded ? 'Hide replies' : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}</span>
                    </button>
                  ` : ''}
                </div>
                <button type="button" class="comment-delete-btn" data-id="${c.id}" aria-label="Delete comment" title="Delete comment">
                  ${DELETE_COMMENT_SVG}
                </button>
              </div>

              ${renderReplies(c.replies, c.id, isExpanded)}
            </div>
          </article>
        `;
      }).join('');
    }

    // Deletion functions for comments and replies
    function deleteComment(id) {
      if (activeReplyTarget && activeReplyTarget.parentId === id) {
        clearReplyTarget();
      }

      if (window.MRGFirebaseComments && typeof window.MRGFirebaseComments.deleteComment === 'function') {
        window.MRGFirebaseComments.deleteComment(id).catch(() => {});
      }

      const el = document.getElementById(`comment-${id}`);
      if (el) {
        el.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.96)';
        setTimeout(() => {
          comments = comments.filter((c) => c.id !== id);
          expandedReplyIds.delete(id);
          saveComments();
          renderComments();
        }, 160);
      } else {
        comments = comments.filter((c) => c.id !== id);
        expandedReplyIds.delete(id);
        saveComments();
        renderComments();
      }
    }

    function deleteReply(parentId, replyId) {
      if (activeReplyTarget && activeReplyTarget.parentId === parentId && activeReplyTarget.isReplyToReply) {
        clearReplyTarget();
      }

      if (window.MRGFirebaseComments && typeof window.MRGFirebaseComments.deleteReply === 'function') {
        window.MRGFirebaseComments.deleteReply(parentId, replyId).catch(() => {});
      }

      const el = document.getElementById(`comment-${replyId}`);
      if (el) {
        el.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.96)';
        setTimeout(() => {
          const parent = comments.find((c) => c.id === parentId);
          if (parent && Array.isArray(parent.replies)) {
            parent.replies = parent.replies.filter((r) => r.id !== replyId);
          }
          saveComments();
          renderComments();
        }, 160);
      } else {
        const parent = comments.find((c) => c.id === parentId);
        if (parent && Array.isArray(parent.replies)) {
          parent.replies = parent.replies.filter((r) => r.id !== replyId);
        }
        saveComments();
        renderComments();
      }
    }

    // Handle delegated clicks inside comments stream
    commentsListEl.addEventListener('click', (e) => {
      // Delete button click
      const deleteBtn = e.target.closest('.comment-delete-btn');
      if (deleteBtn) {
        const commentId = deleteBtn.getAttribute('data-id');
        const parentId = deleteBtn.getAttribute('data-parent-id');
        if (parentId) {
          deleteReply(parentId, commentId);
        } else {
          deleteComment(commentId);
        }
        return;
      }

      // Toggle replies visibility
      const toggleRepliesBtn = e.target.closest('.comment-toggle-replies-btn');
      if (toggleRepliesBtn) {
        const parentId = toggleRepliesBtn.getAttribute('data-parent-id');
        if (parentId) {
          if (expandedReplyIds.has(parentId)) {
            expandedReplyIds.delete(parentId);
          } else {
            expandedReplyIds.add(parentId);
          }
          renderComments();
        }
        return;
      }

      // Reply button click
      const replyBtn = e.target.closest('.comment-reply-btn');
      if (replyBtn) {
        const parentId = replyBtn.getAttribute('data-parent-id');
        const author = replyBtn.getAttribute('data-author');
        const isReply = replyBtn.getAttribute('data-is-reply') === 'true';
        if (parentId && author) {
          setReplyTarget(parentId, author, isReply);
        }
        return;
      }
    });

    // Reply target management: No @ symbol in banner or placeholder
    function setReplyTarget(parentId, authorName, isReplyToReply = false) {
      const activeUser = getActiveUser();
      if (!activeUser.isLoggedIn) {
        if (window.MRGFirebaseComments && typeof window.MRGFirebaseComments.signInWithGoogle === 'function') {
          window.MRGFirebaseComments.signInWithGoogle().then(res => {
            if (res && res.success) {
              updateCurrentAvatarUI();
              setReplyTarget(parentId, authorName, isReplyToReply);
            }
          });
        } else if (window.RadiologyAuth && typeof window.RadiologyAuth.signInWithGoogle === 'function') {
          window.RadiologyAuth.signInWithGoogle().then(() => {
            updateCurrentAvatarUI();
            setReplyTarget(parentId, authorName, isReplyToReply);
          });
        }
        return;
      }

      activeReplyTarget = { parentId, replyToAuthor: authorName, isReplyToReply };
      const authorTextEl = document.getElementById('replying-author-text');
      if (authorTextEl) {
        authorTextEl.textContent = authorName;
      } else if (replyingToName) {
        replyingToName.textContent = authorName;
      }
      if (replyingBanner) {
        replyingBanner.classList.remove('is-hidden');
      }
      if (commentInput) {
        commentInput.disabled = false;
        commentInput.placeholder = `Reply to ${authorName}...`;
        commentInput.focus();
      }
    }

    function clearReplyTarget() {
      activeReplyTarget = null;
      if (replyingBanner) {
        replyingBanner.classList.add('is-hidden');
      }
      if (commentInput) {
        commentInput.placeholder = 'Add to the discussion...';
      }
    }

    if (cancelReplyBtn) {
      cancelReplyBtn.addEventListener('click', clearReplyTarget);
    }

    // Form Submission (Add Comment or Reply)
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const activeUser = getActiveUser();
      if (!activeUser.isLoggedIn) {
        if (window.MRGFirebaseComments && typeof window.MRGFirebaseComments.signInWithGoogle === 'function') {
          window.MRGFirebaseComments.signInWithGoogle().then(res => {
            if (res && res.success) {
              updateCurrentAvatarUI();
              if (commentInput) {
                commentInput.disabled = false;
                commentInput.focus();
              }
            }
          });
        } else if (window.RadiologyAuth && typeof window.RadiologyAuth.signInWithGoogle === 'function') {
          window.RadiologyAuth.signInWithGoogle();
          updateCurrentAvatarUI();
        }
        return;
      }

      if (!commentInput) return;
      const text = commentInput.value.trim();
      if (!text) return;

      const newId = 'cmt-' + Date.now();
      const currentTimestamp = Date.now();
      const authorName = activeUser.name || 'Clinician';
      let userAvatarUrl = activeUser.avatar || null;
      if (!userAvatarUrl) {
        try {
          userAvatarUrl = localStorage.getItem('my_radiology_user_avatar');
        } catch (e) {}
        if (!userAvatarUrl) {
          userAvatarUrl = getDicebearAvatar('user-' + Math.random().toString(36).substring(2, 9));
          if (userAvatarUrl) {
            try {
              localStorage.setItem('my_radiology_user_avatar', userAvatarUrl);
            } catch (e) {}
          }
        }
      }
      const avatarInitials = authorName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase() || 'CL';

      if (activeReplyTarget && activeReplyTarget.parentId) {
        // Add as reply to target parent (flat replies list, with @ Name pill if replying to a reply)
        const parent = comments.find((c) => c.id === activeReplyTarget.parentId);
        if (parent) {
          if (!Array.isArray(parent.replies)) {
            parent.replies = [];
          }
          parent.replies.push({
            id: newId,
            author: authorName,
            avatarUrl: userAvatarUrl,
            avatarText: avatarInitials,
            avatarBg: '#0891b2',
            timestamp: currentTimestamp,
            text: text,
            mention: activeReplyTarget.isReplyToReply ? activeReplyTarget.replyToAuthor : null
          });
          if (window.MRGFirebaseComments && typeof window.MRGFirebaseComments.addReply === 'function') {
            window.MRGFirebaseComments.addReply(activeReplyTarget.parentId, {
              author: authorName,
              avatarUrl: userAvatarUrl,
              avatarText: avatarInitials,
              avatarBg: '#0891b2',
              text: text,
              mention: activeReplyTarget.isReplyToReply ? activeReplyTarget.replyToAuthor : null
            }).catch((err) => {
              console.warn('[Comments] Remote reply write notice:', err);
            });
          }
          expandedReplyIds.add(activeReplyTarget.parentId);
          clearReplyTarget();
        }
      } else {
        // Add top-level comment at top
        comments.unshift({
          id: newId,
          author: authorName,
          avatarUrl: userAvatarUrl,
          avatarText: avatarInitials,
          avatarBg: '#0284c7',
          timestamp: currentTimestamp,
          text: text,
          replies: []
        });

        if (window.MRGFirebaseComments && typeof window.MRGFirebaseComments.addComment === 'function') {
          window.MRGFirebaseComments.addComment({
            author: authorName,
            avatarUrl: userAvatarUrl,
            avatarText: avatarInitials,
            avatarBg: '#0284c7',
            text: text
          }).then((createdComment) => {
            if (createdComment && createdComment.id) {
              const item = comments.find((c) => c.id === newId);
              if (item) {
                item.id = createdComment.id;
                saveComments();
              }
            }
          }).catch((err) => {
            console.warn('[Comments] Remote write notice:', err);
          });
        }
      }

      saveComments();
      commentInput.value = '';
      commentInput.style.height = '38px';
      updatePostPillVisibility();
      renderComments();

      // Scroll to new comment smoothly with rounded highlight & generous spacing
      setTimeout(() => {
        const newEl = document.getElementById(`comment-${newId}`);
        if (newEl) {
          newEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          newEl.classList.add('is-new-comment');
          setTimeout(() => {
            newEl.classList.remove('is-new-comment');
          }, 1800);
        }
      }, 60);
    });

    // Open / Close Modal & Bottom Sheet Functions
    function openModal() {
      overlay.classList.add('is-active');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      updateCurrentAvatarUI();
      loadComments();
      const activeUser = getActiveUser();
      if (activeUser.isLoggedIn) {
        setTimeout(() => {
          if (commentInput) {
            commentInput.disabled = false;
            commentInput.focus();
          }
        }, 200);
      }
    }

    function closeModal() {
      overlay.classList.remove('is-active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      clearReplyTarget();
      if (commentInput) {
        commentInput.value = '';
        updatePostPillVisibility();
      }
    }

    // Expose openCommentsModal globally for #post-comment-btn
    window.openCommentsModal = openModal;
    window.closeCommentsModal = closeModal;

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // Backdrop click dismiss
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Keyboard ESC dismiss
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-active')) {
        closeModal();
      }
    });

    // Mobile touch swipe down on grab handle to dismiss bottom sheet
    if (sheetHandle) {
      let touchStartY = 0;
      let touchCurrentY = 0;

      sheetHandle.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      sheetHandle.addEventListener('touchmove', (e) => {
        touchCurrentY = e.touches[0].clientY;
        const diff = touchCurrentY - touchStartY;
        if (diff > 0 && modal) {
          modal.style.transform = `translate3d(0, ${diff}px, 0)`;
        }
      }, { passive: true });

      sheetHandle.addEventListener('touchend', () => {
        const diff = touchCurrentY - touchStartY;
        if (modal) {
          modal.style.transform = '';
        }
        if (diff > 75) {
          closeModal();
        }
        touchStartY = 0;
        touchCurrentY = 0;
      });
    }

    // Initial render
    renderComments();
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

  function init() {
    initPostActions();
    initPostTabs();
    initCodeCopy();
    initChecklist();
    initSmoothScroll();
    initMathAndChem();
    initCommentsModal();
    initTopicsShowMore();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
