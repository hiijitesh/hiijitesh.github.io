/**
 * TourSection Component
 * Manages the city notifications form and organizer email copy interaction.
 */
import { Toast } from './Toast.js';
import { validateEmail } from '../utils/validator.js';

export class TourSectionComponent {
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

    const validation = validateEmail(email);
    if (!validation.valid) {
      Toast.show(validation.error);
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
    Toast.show('Done bhai! Jaise hi dates final honge pehle message kar dunga.');
  }

  handleCopyEmail() {
    const email = 'beatbyjit@gmail.com';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email)
        .then(() => Toast.show('Email copy ho gaya bhai, ab message bhej bhi do.'))
        .catch(() => Toast.show(email));
    } else {
      Toast.show(email);
    }
  }
}
