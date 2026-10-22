/**
 * TourSection Component
 * Manages the city notifications form and organizer email copy interaction.
 */
window.App = window.App || {};

(function(App) {
  class TourSectionComponent {
    constructor() {
      this.cityForm = document.querySelector('.city-form');
      this.emailInput = this.cityForm ? this.cityForm.querySelector('.city-input') : null;
      this.copyEmailBtn = document.getElementById('copy-email-btn');

      this.init();
    }

    init() {
      if (this.cityForm) {
        this.cityForm.addEventListener('submit', (e) => this.handleTourNotify(e));
      }

      if (this.copyEmailBtn) {
        this.copyEmailBtn.addEventListener('click', () => this.handleCopyEmail());
      }
    }

    async handleTourNotify(e) {
      if (e && e.preventDefault) e.preventDefault();
      if (this.isSubmitting) return;

      const email = this.emailInput ? this.emailInput.value.trim() : '';

      const validation = App.validateEmail ? App.validateEmail(email) : { valid: true };
      if (!validation.valid) {
        if (App.Toast) App.Toast.show(validation.error);
        if (this.emailInput) {
          this.emailInput.focus();
          this.emailInput.style.borderColor = 'var(--accent)';
          setTimeout(() => {
            if (this.emailInput) this.emailInput.style.borderColor = '';
          }, 2200);
        }
        return;
      }

      this.isSubmitting = true;
      const submitBtn = this.cityForm ? this.cityForm.querySelector('button[type="submit"], .city-btn') : null;
      const originalText = submitBtn ? submitBtn.textContent : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving... ⏳';
      }

      try {
        let result = null;
        if (typeof App.storeUserEmail === 'function') {
          result = await App.storeUserEmail(email, { source: 'tour_section' });
        }

        if (this.cityForm) this.cityForm.reset();

        if (result && result.alreadySubscribed) {
          if (App.Toast) App.Toast.show(result.message || 'Tu na already list me hain chill kr');
        } else {
          if (App.Toast) App.Toast.show('Done Bhai!');
        }
      } catch (err) {
        console.error('Failed to store email:', err);
        if (this.cityForm) this.cityForm.reset();
        if (App.Toast) App.Toast.show('Done Bhai!');
      } finally {
        this.isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    }

    handleCopyEmail() {
      const email = 'beatbyjit@gmail.com';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email)
          .then(() => {
            if (App.Toast) App.Toast.show('Email copy ho gaya bhai, ab message bhej bhi do.');
          })
          .catch(() => {
            if (App.Toast) App.Toast.show(email);
          });
      } else {
        if (App.Toast) App.Toast.show(email);
      }
    }
  }

  App.TourSectionComponent = TourSectionComponent;
})(window.App);
