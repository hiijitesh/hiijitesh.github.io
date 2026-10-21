/**
 * TicketModal Component
 * Manages ticket booking popup, form validations, and confirmation messages.
 */
window.App = window.App || {};

(function(App) {
  class TicketModalComponent {
    constructor() {
      this.modal = null;
      this.titleEl = null;
      this.venueEl = null;
      this.dateEl = null;
      this.priceEl = null;
      this.closeBtn = null;
      this.form = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      this.modal = document.getElementById('ticket-modal');
      this.titleEl = document.getElementById('t-modal-title');
      this.venueEl = document.getElementById('t-modal-venue');
      this.dateEl = document.getElementById('t-modal-date');
      this.priceEl = document.getElementById('t-modal-price');
      this.closeBtn = document.getElementById('ticket-close');
      this.form = this.modal ? this.modal.querySelector('.t-form') : null;

      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.close());
      }
      if (this.modal) {
        this.modal.addEventListener('click', (e) => {
          if (e.target === this.modal) this.close();
        });
      }
      if (this.form) {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
      }
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });
      this.initialized = true;
    }

    open({ city = 'City', date = '', venue = '', title = 'Show', price = '₹499' } = {}) {
      this.init();
      if (!this.modal) return;
      if (this.titleEl) this.titleEl.textContent = title;
      if (this.venueEl) this.venueEl.textContent = `${venue} • ${city}`;
      if (this.dateEl) this.dateEl.textContent = date;
      if (this.priceEl) this.priceEl.textContent = price;
      this.modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    close() {
      if (!this.modal) return;
      this.modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    isOpen() {
      return this.modal && this.modal.classList.contains('active');
    }

    handleSubmit(e) {
      if (e && e.preventDefault) e.preventDefault();
      const nameInput = document.getElementById('t-buyer-name');
      const emailInput = document.getElementById('t-buyer-email');
      const buyerName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Bhai';
      const buyerEmail = emailInput ? emailInput.value.trim() : '';

      const validation = App.validateEmail ? App.validateEmail(buyerEmail) : { valid: true };
      if (!validation.valid) {
        if (App.Toast) App.Toast.show(validation.error);
        if (emailInput) {
          emailInput.focus();
          emailInput.style.borderColor = 'var(--accent)';
          setTimeout(() => {
            if (emailInput) emailInput.style.borderColor = '';
          }, 2200);
        }
        return;
      }

      this.close();
      if (this.form) this.form.reset();
      if (App.Toast) {
        App.Toast.show(`Done bhai! ${buyerName}, ticket confirm ho gaya. Milte hain show pe 🎟️`);
      }
    }
  }

  App.TicketModal = new TicketModalComponent();
  window.TicketModal = App.TicketModal;
})(window.App);
