/**
 * JITESH GIRI — Main Application Orchestrator
 * Modular ES Architecture importing isolated components:
 * - Toast: System-wide alerts
 * - ReaderModal: Fullscreen poem reader with title deduplication
 * - TicketModal: Live booking modal
 * - PoetrySectionComponent: Dynamic grid & filtering
 * - TourSectionComponent: City notify & organizer copy
 */

import { Toast } from './components/Toast.js';
import { ReaderModal } from './components/ReaderModal.js';
import { TicketModal } from './components/TicketModal.js';
import { PoetrySectionComponent } from './components/PoetrySection.js';
import { TourSectionComponent } from './components/TourSection.js';
import { isValidEmail } from './utils/validator.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI components
  new PoetrySectionComponent();
  new TourSectionComponent();

  // Expose global methods for any inline handlers or external calls
  window.showToast = (msg) => Toast.show(msg);
  window.openTicketModal = (city, date, venue, title, price) => {
    TicketModal.open({ city, date, venue, title, price });
  };
  window.handleTicketBooking = (e) => TicketModal.handleSubmit(e);
  window.handleTourNotify = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const input = e && e.target ? e.target.querySelector('input[type="email"]') : null;
    const email = input ? input.value.trim() : '';
    if (!isValidEmail(email)) {
      Toast.show('Bhai, sahi email address likho!');
      if (input) input.focus();
      return;
    }
    if (e && e.target && e.target.reset) e.target.reset();
    Toast.show('Done bhai! Jaise hi dates final honge pehle message kar dunga.');
  };
});
