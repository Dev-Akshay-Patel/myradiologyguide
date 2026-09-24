/**
 * LOGIN JS
 * Handles frontend Google Sign-In interaction, state management, and persistence
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'my_radiology_user_session';

  document.addEventListener('DOMContentLoaded', () => {
    initLogin();
  });

  function initLogin() {
    const loggedOutView = document.getElementById('login-logged-out-view');
    const signedInView = document.getElementById('login-signed-in-view');
    const googleBtn = document.getElementById('google-signin-btn');
    const googleBtnText = document.getElementById('google-btn-text');
    const signoutBtn = document.getElementById('login-signout-btn');
    
    // Profile elements
    const avatarImg = document.getElementById('user-avatar-img');
    const displayName = document.getElementById('user-display-name');
    const displayEmail = document.getElementById('user-display-email');

    // Check existing state
    updateAuthUI();

    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        handleGoogleSignIn();
      });
    }

    if (signoutBtn) {
      signoutBtn.addEventListener('click', () => {
        handleSignOut();
      });
    }

    function handleGoogleSignIn() {
      if (!googleBtn || googleBtn.classList.contains('is-loading')) return;

      googleBtn.classList.add('is-loading');
      if (googleBtnText) {
        googleBtnText.textContent = 'Connecting with Google...';
      }

      // Simulated realistic frontend Google OAuth handshake
      setTimeout(() => {
        const sessionData = {
          name: 'Akshay Patel',
          email: 'mr.akshaypatel05@gmail.com',
          avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
          provider: 'google',
          timestamp: Date.now()
        };

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
          window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: sessionData }));
        } catch (e) {
          console.warn('Could not save session to localStorage', e);
        }

        googleBtn.classList.remove('is-loading');
        if (googleBtnText) {
          googleBtnText.textContent = 'Continue with Google';
        }

        updateAuthUI();
      }, 700);
    }

    function handleSignOut() {
      try {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: null }));
      } catch (e) {
        console.warn('Could not remove session', e);
      }

      updateAuthUI();
    }

    function updateAuthUI() {
      let session = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          session = JSON.parse(raw);
        }
      } catch (e) {}

      if (session && session.email) {
        if (loggedOutView) loggedOutView.classList.add('is-hidden');
        if (signedInView) signedInView.classList.remove('is-hidden');

        if (displayName) displayName.textContent = session.name || 'Clinical Radiologist';
        if (displayEmail) displayEmail.textContent = session.email;
        if (avatarImg) {
          avatarImg.src = session.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80';
          avatarImg.alt = session.name || 'User profile';
        }
      } else {
        if (loggedOutView) loggedOutView.classList.remove('is-hidden');
        if (signedInView) signedInView.classList.add('is-hidden');
      }
    }
  }
})();
