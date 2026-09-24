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

  const SVG_SAVE_PLUS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M14.5 10.6504H9.5" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M12 8.21094V13.2109" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M16.8199 2H7.17995C5.04995 2 3.31995 3.74 3.31995 5.86V19.95C3.31995 21.75 4.60995 22.51 6.18995 21.64L11.0699 18.93C11.5899 18.64 12.4299 18.64 12.9399 18.93L17.8199 21.64C19.3999 22.52 20.6899 21.76 20.6899 19.95V5.86C20.6799 3.74 18.9499 2 16.8199 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;

  const SVG_SAVE_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16.8199 2H7.17995C5.04995 2 3.31995 3.74 3.31995 5.86V19.95C3.31995 21.75 4.60995 22.51 6.18995 21.64L11.0699 18.93C11.5899 18.64 12.4299 18.64 12.9399 18.93L17.8199 21.64C19.3999 22.52 20.6899 21.76 20.6899 19.95V5.86C20.6799 3.74 18.9499 2 16.8199 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
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
        if (saveText) saveText.textContent = 'Saved';
        if (saveIcon) saveIcon.innerHTML = SVG_SAVE_CHECK;
      } else {
        saveBtn.classList.remove('is-active');
        saveBtn.setAttribute('aria-pressed', 'false');
        if (saveText) saveText.textContent = 'Save';
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
          if (shareText) {
            const old = shareText.textContent;
            shareText.textContent = 'Copied!';
            setTimeout(() => {
              shareText.textContent = old;
            }, 2000);
          }
        } catch (e) {}
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPostActions);
  } else {
    initPostActions();
  }
})();
