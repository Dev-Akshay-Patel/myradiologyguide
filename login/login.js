/**
 * LOGIN JS
 * Handles frontend Google Sign-In interaction, automatic account redirection, and session persistence
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'my_radiology_user_session';

  document.addEventListener('DOMContentLoaded', () => {
    initLogin();
  });

  function initLogin() {
    // If already logged in, redirect immediately to account dashboard
    let existingSession = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) existingSession = JSON.parse(raw);
    } catch (e) {}

    if (existingSession && existingSession.email) {
      window.location.replace('../account/index.html');
      return;
    }

    const googleBtn = document.getElementById('google-signin-btn');
    const googleBtnText = document.getElementById('google-btn-text');

    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        handleGoogleSignIn();
      });
    }

    function getDicebearAvatar(seed = 'Glyphs') {
      if (typeof window !== 'undefined' && window.DiceBear && typeof window.DiceBear.getRandomAvatar === 'function') {
        return window.DiceBear.getRandomAvatar(seed || 'Glyphs', 'shapes');
      }
      return '';
    }

    function handleGoogleSignIn() {
      if (!googleBtn || googleBtn.classList.contains('is-loading')) return;

      googleBtn.classList.add('is-loading');
      if (googleBtnText) {
        googleBtnText.textContent = 'Connecting with Google...';
      }

      // Simulated realistic frontend Google OAuth handshake
      setTimeout(() => {
        const userEmail = 'mr.akshaypatel05@gmail.com';
        const userName = 'Akshay Patel';
        
        // Single deterministic user icon using seed 'Glyphs'
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
        } catch (e) {
          console.warn('Could not save session to localStorage', e);
        }

        // Immediately redirect user when login to account
        window.location.href = '../account/index.html';
      }, 500);
    }
  }
})();
