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

    handleTourNotify(e) {
      if (e && e.preventDefault) e.preventDefault();
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

      if (this.cityForm) this.cityForm.reset();
      if (App.Toast) {
        App.Toast.show('Done bhai! Jaise hi dates final honge pehle message kar dunga.');
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
