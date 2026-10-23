/**
 * ThankYouView Component
 * Displays the dedicated, full-screen minimal confirmation view:
 * "Email mil gaya. Thanks!"
 * Matches the editorial dark aesthetic with clean back navigation.
 */
window.App = window.App || {};

(function(App) {
  'use strict';

  class ThankYouViewComponent {
    constructor() {
      this.view = null;
      this.backBtn = null;
      this.initialized = false;
      this.previousFocusedEl = null;
    }

    init() {
      if (this.initialized) return;

      this.view = document.getElementById('thank-you-view');
      this.backBtn = document.getElementById('thank-you-back-btn');

      if (this.backBtn) {
        this.backBtn.addEventListener('click', (e) => {
          if (e && e.preventDefault) e.preventDefault();
          this.close();
        });
      }

      // Close if user clicks outside content on overlay backdrop
      if (this.view) {
        this.view.addEventListener('click', (e) => {
          if (e.target === this.view) {
            this.close();
          }
        });
      }

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });

      // Support mobile / browser back button via popstate
      window.addEventListener('popstate', (e) => {
        if (this.isOpen()) {
          this.close(false);
        }
      });

      this.initialized = true;
    }

    open() {
      this.init();
      if (!this.view) return;

      this.previousFocusedEl = document.activeElement;
      this.view.classList.add('active');
      this.view.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Push history entry for smooth back button behavior
      try {
        if (!history.state || !history.state.thankYouOpen) {
          history.pushState({ thankYouOpen: true }, '', '#confirmed');
        }
      } catch {}

      // Focus back button for accessibility
      if (this.backBtn) {
        setTimeout(() => {
          try {
            this.backBtn.focus();
          } catch {}
        }, 100);
      }
    }

    close(shouldGoBackInHistory = true) {
      if (!this.view) return;

      this.view.classList.remove('active');
      this.view.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      if (shouldGoBackInHistory && history.state && history.state.thankYouOpen) {
        try {
          history.back();
        } catch {}
      } else if (window.location.hash === '#confirmed') {
        try {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch {}
      }

      if (this.previousFocusedEl && typeof this.previousFocusedEl.focus === 'function') {
        try {
          this.previousFocusedEl.focus();
        } catch {}
      }
    }

    isOpen() {
      return this.view && this.view.classList.contains('active');
    }
  }

  App.ThankYouView = new ThankYouViewComponent();
  window.ThankYouView = App.ThankYouView;
})(window.App);
