/**
 * ACCOUNT JS
 * Manages full-page user profile dashboard, single deterministic avatar (seed: Glyphs), and sign out
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'my_radiology_user_session';

  document.addEventListener('DOMContentLoaded', () => {
    initAccount();
  });

  function initAccount() {
    const signedInView = document.getElementById('account-signed-in-view');
    const loggedOutView = document.getElementById('account-logged-out-view');

    const avatarImg = document.getElementById('account-avatar-img');
    const nameEl = document.getElementById('account-display-name');
    const emailEl = document.getElementById('account-display-email');
    const memberDateEl = document.getElementById('account-member-date');
    const signoutBtn = document.getElementById('account-signout-btn');
    const googleLoginBtn = document.getElementById('account-google-login-btn');

    render();

    if (signoutBtn) {
      signoutBtn.addEventListener('click', handleSignOut);
    }

    if (googleLoginBtn) {
      googleLoginBtn.addEventListener('click', handleGoogleSignIn);
    }

    window.addEventListener('auth-state-changed', render);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) render();
    });

    function getDicebearAvatar(seed = 'Glyphs') {
      if (typeof window !== 'undefined' && window.DiceBear && typeof window.DiceBear.getRandomAvatar === 'function') {
        return window.DiceBear.getRandomAvatar(seed || 'Glyphs', 'shapes');
      }
      return '';
    }

    function handleSignOut() {
      try {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: null }));
      } catch (e) {
        console.warn('Could not remove session', e);
      }
      render();
    }

    function handleGoogleSignIn() {
      const userEmail = 'mr.akshaypatel05@gmail.com';
      const userName = 'Akshay Patel';
      const dicebearAvatar = getDicebearAvatar('Glyphs');

      const sessionData = {
        name: userName,
        email: userEmail,
        seed: 'Glyphs',
        avatar: dicebearAvatar,
        isDicebear: true,
        provider: 'google',
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: sessionData }));
      } catch (e) {}
      render();
    }

    function getSession() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    }

    function render() {
      const session = getSession();

      if (session && session.email) {
        if (signedInView) signedInView.classList.remove('is-hidden');
        if (loggedOutView) loggedOutView.classList.add('is-hidden');

        if (nameEl) nameEl.textContent = session.name || 'Akshay Patel';
        if (emailEl) emailEl.textContent = session.email;
        if (memberDateEl) {
          const date = session.timestamp ? new Date(session.timestamp).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'September 2026';
          memberDateEl.textContent = date;
        }

        if (avatarImg) {
          let avatarSrc = session.avatar;
          const isOld = !session.seed || session.seed !== 'Glyphs' || !avatarSrc || (typeof avatarSrc === 'string' && (avatarSrc.includes('viewboxMask') || avatarSrc.includes('%3Cmask')));
          if (isOld) {
            avatarSrc = getDicebearAvatar('Glyphs');
            session.avatar = avatarSrc;
            session.seed = 'Glyphs';
            session.isDicebear = true;
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
              window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: session }));
            } catch (e) {}
          }
          avatarImg.src = avatarSrc;
          avatarImg.alt = session.name || 'User avatar';
        }
      } else {
        if (signedInView) signedInView.classList.add('is-hidden');
        if (loggedOutView) loggedOutView.classList.remove('is-hidden');
      }
    }
  }
})();
