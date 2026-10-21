bb/**
 * TicketModal Component
 * Manages ticket booking popup, form validations, and confirmation messages.
 */
import { Toast } from './Toast.js';
import { validateEmail } from '../utils/validator.js';

export class TicketModalComponent {
  constructor() {
    this.modal = document.getElementById('ticket-modal');
    this.titleEl = document.getElementById('t-modal-title');
    this.venueEl = document.getElementById('t-modal-venue');
    this.dateEl = document.getElementById('t-modal-date');
    this.priceEl = document.getElementById('t-modal-price');
    this.closeBtn = document.getElementById('ticket-close');
    this.form = this.modal ? this.modal.querySelector('.t-form') : null;

    this.init();
  }

  init() {
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
  }

  open({ city = 'City', date = '', venue = '', title = 'Show', price = '₹499' } = {}) {
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

    const validation = validateEmail(buyerEmail);
    if (!validation.valid) {
      Toast.show(validation.error);
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
    Toast.show(`Done bhai! ${buyerName}, ticket confirm ho gaya. Milte hain show pe 🎟️`);
  }
}

export const TicketModal = new TicketModalComponent();
