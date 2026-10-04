/**
 * LOGIN JS
 * Handles Dual-Path Authentication:
 * 1. 100% Cookie-based Local Account (Zero server upload, customizable name & avatar)
 * 2. Google Account (Unmodified simulation ready for future Firebase Auth)
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initAuthPage();
  });

  function initAuthPage() {
    const authWrapper = document.getElementById('login-card');
    if (!authWrapper) return;

    const signedInView = document.getElementById('login-signed-in-view');
    const loggedOutView = document.getElementById('login-logged-out-view');

    const signedInAvatar = document.getElementById('signed-in-avatar');
    const signedInName = document.getElementById('signed-in-name');
    const signedInMeta = document.getElementById('signed-in-meta');
    const signedInBadge = document.getElementById('signed-in-badge');
    const switchBtn = document.getElementById('login-switch-btn');

    // Segmented Mode Switcher
    const tabLocal = document.getElementById('tab-mode-local');
    const tabGoogle = document.getElementById('tab-mode-google');
    const paneLocal = document.getElementById('auth-pane-local');
    const paneGoogle = document.getElementById('auth-pane-google');

    // Local Account Form Elements
    const localForm = document.getElementById('local-account-form');
    const localNameInput = document.getElementById('local-name-input');
    const avatarPreviewImg = document.getElementById('local-avatar-preview');
    const btnRandomAvatar = document.getElementById('btn-random-avatar');
    const fileUploadInput = document.getElementById('local-avatar-upload');
    const avatarUploadLabel = document.getElementById('avatar-upload-label');
    const avatarFileChip = document.getElementById('avatar-file-chip');
    const avatarFileName = document.getElementById('avatar-file-name');
    const avatarFileSize = document.getElementById('avatar-file-size');
    const btnDeleteAvatarFile = document.getElementById('btn-delete-avatar-file');
    const loggingOutOverlay = document.getElementById('logging-out-overlay');

    // Google Sign-In Elements
    const googleBtn = document.getElementById('google-signin-btn');
    const googleBtnText = document.getElementById('google-btn-text');

    // Safe avatar fallback (DiceBear or SVG data URI)
    function safeGetAvatar(seed = 'radiology-user') {
      const generated = generateDicebear(seed);
      if (generated) return generated;
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e2e8f0'/%3E%3Ccircle cx='50' cy='40' r='20' fill='%2394a3b8'/%3E%3Cpath d='M20,85 C20,68 35,62 50,62 C65,62 80,68 80,85' fill='%2394a3b8'/%3E%3C/svg%3E";
    }

    // Current Avatar State for Local Account (DiceBear random or uploaded image)
    const initialSeed = 'rad-physician-' + Math.random().toString(36).substring(2, 8);
    let currentAvatarData = safeGetAvatar(initialSeed);
    let currentAvatarType = 'dicebear';
    let currentAvatarSeed = initialSeed;

    if (avatarPreviewImg) {
      avatarPreviewImg.onerror = () => {
        avatarPreviewImg.src = safeGetAvatar(currentAvatarSeed);
      };
      avatarPreviewImg.src = currentAvatarData;
    }

    if (signedInAvatar) {
      signedInAvatar.onerror = () => {
        signedInAvatar.src = safeGetAvatar('radiology-user');
      };
    }

    // Material Design floating label and Existing Account Detection helper
    if (localNameInput) {
      const syncFloatingLabelAndAccount = () => {
        const val = localNameInput.value.trim();
        if (val.length > 0) {
          localNameInput.classList.add('has-value');
        } else {
          localNameInput.classList.remove('has-value');
        }

        // Auto-detect existing local account in vault
        if (window.RadiologyAuth && typeof window.RadiologyAuth.findStoredAccount === 'function') {
          const stored = window.RadiologyAuth.findStoredAccount(val);
          if (stored && stored.avatar) {
            currentAvatarData = stored.avatar;
            currentAvatarType = stored.avatarType || 'stored';
            currentAvatarSeed = stored.avatarSeed || val;
            updateAvatarPreview(stored.avatar, false);
          }
        }
      };
      localNameInput.addEventListener('input', syncFloatingLabelAndAccount);
      localNameInput.addEventListener('change', syncFloatingLabelAndAccount);
      localNameInput.addEventListener('blur', syncFloatingLabelAndAccount);
      syncFloatingLabelAndAccount();
    }

    // Check query params (e.g. ?mode=google or ?mode=local)
    const urlParams = new URLSearchParams(window.location.search);
    const requestedMode = urlParams.get('mode');

    // 1. Check current session
    checkSessionState();

    // 2. Setup Mode Switcher Tabs
    if (tabLocal && tabGoogle) {
      tabLocal.addEventListener('click', () => switchAuthMode('local'));
      tabGoogle.addEventListener('click', () => switchAuthMode('google'));

      if (requestedMode === 'google') {
        switchAuthMode('google');
      }
    }

    // 3. Circular Randomize Avatar Button on Profile Preview
    if (btnRandomAvatar) {
      btnRandomAvatar.addEventListener('click', () => {
        // Clear uploaded file if any
        clearUploadedFile(false);

        const randSeed = 'rad-user-' + Math.random().toString(36).substring(2, 9);
        const newAvatar = generateDicebear(randSeed);
        if (newAvatar) {
          currentAvatarData = newAvatar;
          currentAvatarType = 'dicebear';
          currentAvatarSeed = randSeed;
          updateAvatarPreview(newAvatar, true);
        }
      });
    }

    // 5. Image File Upload & Delete
    if (fileUploadInput) {
      fileUploadInput.addEventListener('change', handleFileUpload);
    }

    if (btnDeleteAvatarFile) {
      btnDeleteAvatarFile.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearUploadedFile(true);
      });
    }

    // 6. Local Account Form Submission
    if (localForm) {
      localForm.addEventListener('submit', handleLocalAccountSubmit);
    }

    // 7. Google Sign-In Action (Untouched flow)
    if (googleBtn) {
      googleBtn.addEventListener('click', handleGoogleSignIn);
    }

    // 8. Sign Out / Switch Account with "Logging Out .. .." animation
    if (switchBtn) {
      switchBtn.addEventListener('click', () => {
        if (loggingOutOverlay) {
          loggingOutOverlay.classList.remove('is-hidden');
        }
        setTimeout(() => {
          if (window.RadiologyAuth) {
            window.RadiologyAuth.clearSession();
          } else {
            localStorage.removeItem('my_radiology_user_session');
          }
          if (loggingOutOverlay) {
            loggingOutOverlay.classList.add('is-hidden');
          }
          checkSessionState();
        }, 450);
      });
    }

    /* ========================================================================
       HELPER FUNCTIONS
       ======================================================================== */

    function switchAuthMode(mode) {
      const isLocal = mode === 'local';
      
      tabLocal.classList.toggle('is-active', isLocal);
      tabLocal.setAttribute('aria-selected', isLocal ? 'true' : 'false');

      tabGoogle.classList.toggle('is-active', !isLocal);
      tabGoogle.setAttribute('aria-selected', !isLocal ? 'true' : 'false');

      paneLocal.classList.toggle('is-active', isLocal);
      paneGoogle.classList.toggle('is-active', !isLocal);
    }

    function checkSessionState() {
      let session = null;
      if (window.RadiologyAuth && typeof window.RadiologyAuth.getSession === 'function') {
        session = window.RadiologyAuth.getSession();
      } else {
        try {
          const raw = localStorage.getItem('my_radiology_user_session');
          if (raw) session = JSON.parse(raw);
        } catch (e) {}
      }

      if (session && (session.name || session.email)) {
        if (signedInView) signedInView.classList.remove('is-hidden');
        if (loggedOutView) loggedOutView.classList.add('is-hidden');

        if (signedInName) signedInName.textContent = session.name || 'User Profile';
        if (signedInAvatar) {
          signedInAvatar.src = session.avatar || safeGetAvatar(session.name || 'radiology-user');
        }

        const isLocal = session.isLocal || session.provider === 'local';
        if (signedInBadge) {
          signedInBadge.textContent = isLocal ? 'Local Account' : 'Google Verified';
          signedInBadge.className = isLocal ? 'user-account-badge-pill badge-local' : 'user-account-badge-pill badge-google';
        }
        if (signedInMeta) {
          signedInMeta.textContent = isLocal ? 'Local Account' : (session.email || 'Google Account');
        }
      } else {
        if (signedInView) signedInView.classList.add('is-hidden');
        if (loggedOutView) loggedOutView.classList.remove('is-hidden');
      }
    }

    function generateDicebear(seed) {
      if (typeof window !== 'undefined' && window.DiceBear && typeof window.DiceBear.getRandomAvatar === 'function') {
        return window.DiceBear.getRandomAvatar(seed);
      }
      return '';
    }

    function updateAvatarPreview(src, animate = true) {
      if (!avatarPreviewImg) return;
      avatarPreviewImg.src = src;
      if (animate) {
        avatarPreviewImg.classList.remove('is-animating');
        void avatarPreviewImg.offsetWidth;
        avatarPreviewImg.classList.add('is-animating');
      }
    }

    function clearUploadedFile(showToastNotice = false) {
      if (fileUploadInput) fileUploadInput.value = '';
      if (avatarFileChip) {
        avatarFileChip.classList.add('is-hidden');
        avatarFileChip.style.display = 'none';
      }
      if (avatarFileName) avatarFileName.textContent = '';
      if (avatarFileSize) avatarFileSize.textContent = '';
      if (avatarUploadLabel) {
        avatarUploadLabel.classList.remove('is-hidden');
        avatarUploadLabel.style.display = 'inline-flex';
      }

      if (showToastNotice) {
        // Generate a new random avatar
        const randSeed = 'rad-user-' + Math.random().toString(36).substring(2, 9);
        const randAv = generateDicebear(randSeed);
        if (randAv) {
          currentAvatarData = randAv;
          currentAvatarType = 'dicebear';
          currentAvatarSeed = randSeed;
          updateAvatarPreview(randAv, true);
        }
        if (window.RadiologyAuth && typeof window.RadiologyAuth.showToast === 'function') {
          window.RadiologyAuth.showToast('Uploaded image removed. Generated new avatar.', 'info');
        }
      }
    }

    function handleFileUpload(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      // Validate image format
      if (!file.type.startsWith('image/')) {
        if (window.RadiologyAuth) {
          window.RadiologyAuth.showToast('Please select a valid image file (PNG, JPG, WebP, or SVG).', 'warning');
        }
        return;
      }

      // Max size: 2MB for fast local cookie/storage
      if (file.size > 2 * 1024 * 1024) {
        if (window.RadiologyAuth) {
          window.RadiologyAuth.showToast('Image is larger than 2MB. Please select a smaller photo.', 'warning');
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = function (evt) {
        const rawDataUrl = evt.target.result;

        // Resize image through canvas to keep cookie size compact (~96x96px)
        const img = new Image();
        img.onload = function () {
          const canvas = document.createElement('canvas');
          const size = 96;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          // Draw center-cropped square
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          currentAvatarData = compressedDataUrl;
          currentAvatarType = 'upload';
          currentAvatarSeed = 'custom-upload';
          updateAvatarPreview(compressedDataUrl, true);

          // Show file name, size and delete button
          if (avatarFileChip && avatarFileName && avatarFileSize) {
            const shortName = file.name.length > 18 ? file.name.substring(0, 15) + '...' : file.name;
            const sizeKb = Math.round(file.size / 1024);
            avatarFileName.textContent = shortName;
            avatarFileSize.textContent = `(${sizeKb} KB)`;
            avatarFileChip.classList.remove('is-hidden');
            avatarFileChip.style.display = 'inline-flex';
            if (avatarUploadLabel) {
              avatarUploadLabel.classList.add('is-hidden');
              avatarUploadLabel.style.display = 'none';
            }
          }

          if (window.RadiologyAuth) {
            window.RadiologyAuth.showToast('Profile photo loaded successfully.', 'success');
          }
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    }

    function handleLocalAccountSubmit(e) {
      e.preventDefault();

      const name = localNameInput ? localNameInput.value.trim() : '';
      if (!name) {
        if (localNameInput) localNameInput.focus();
        if (window.RadiologyAuth) {
          window.RadiologyAuth.showToast('Please enter your name or clinical handle.', 'warning');
        }
        return;
      }

      const submitBtn = document.getElementById('local-submit-btn');
      const submitBtnText = document.getElementById('local-btn-text');
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtnText) submitBtnText.textContent = 'Connecting with Local Account...';
      }

      setTimeout(() => {
        let authResult = null;
        if (window.RadiologyAuth && typeof window.RadiologyAuth.loginOrRestoreLocalAccount === 'function') {
          authResult = window.RadiologyAuth.loginOrRestoreLocalAccount({
            name: name,
            avatar: currentAvatarData || generateDicebear(name),
            avatarType: currentAvatarType,
            avatarSeed: currentAvatarSeed
          });
        } else if (window.RadiologyAuth && typeof window.RadiologyAuth.createLocalAccount === 'function') {
          const session = window.RadiologyAuth.createLocalAccount({
            name: name,
            avatar: currentAvatarData || generateDicebear(name),
            avatarType: currentAvatarType,
            avatarSeed: currentAvatarSeed
          });
          authResult = { session, isExisting: false };
        }

        if (window.RadiologyAuth) {
          if (authResult && authResult.isExisting) {
            window.RadiologyAuth.showToast(`Welcome back, ${name}! Your account and saved data have been restored.`, 'success');
          } else {
            window.RadiologyAuth.showToast(`Welcome, ${name}! Your local account is ready.`, 'success');
          }
        }

        // Redirect immediately to Account Dashboard
        window.location.href = '../account/index.html';
      }, 350);
    }

    function handleGoogleSignIn() {
      if (!googleBtn || googleBtn.classList.contains('is-loading')) return;

      googleBtn.classList.add('is-loading');
      if (googleBtnText) {
        googleBtnText.textContent = 'Connecting with Google...';
      }

      // Simulated frontend Google OAuth handshake (Leave untouched for future Firebase integration)
      setTimeout(() => {
        const userEmail = 'mr.akshaypatel05@gmail.com';
        const userName = 'Akshay Patel';
        const dicebearAvatar = generateDicebear(userEmail);

        if (window.RadiologyAuth && typeof window.RadiologyAuth.setGoogleAccount === 'function') {
          window.RadiologyAuth.setGoogleAccount({
            name: userName,
            email: userEmail,
            avatar: dicebearAvatar,
            seed: userEmail
          });
        } else {
          const sessionData = {
            name: userName,
            email: userEmail,
            seed: userEmail,
            avatar: dicebearAvatar,
            isDicebear: true,
            style: 'glyphs',
            provider: 'google',
            timestamp: Date.now()
          };
          localStorage.setItem('my_radiology_user_session', JSON.stringify(sessionData));
          window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: sessionData }));
        }

        // Immediately redirect user to destination or Workspace
        const returnUrl = urlParams.get('redirect') || '../account/index.html';
        window.location.href = returnUrl;
      }, 500);
    }
  }
})();
