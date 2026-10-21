/**
 * JITESH GIRI — Main Application Orchestrator
 * Clean modular initializer working universally on both HTTP and local file:// protocols.
 */
document.addEventListener('DOMContentLoaded', () => {
  const App = window.App || {};

  // Initialize modular UI components
  if (App.PoetrySectionComponent) {
    App.poetrySection = new App.PoetrySectionComponent();
  }
  if (App.TourSectionComponent) {
    App.tourSection = new App.TourSectionComponent();
  }

  // Global helper bindings for backward compatibility with HTML attributes
  window.showToast = (msg) => {
    if (App.Toast) App.Toast.show(msg);
  };

  window.openTicketModal = (city, date, venue, title, price) => {
    if (App.TicketModal) App.TicketModal.open({ city, date, venue, title, price });
  };

  window.handleTicketBooking = (e) => {
    if (App.TicketModal) App.TicketModal.handleSubmit(e);
  };

  window.handleTourNotify = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const input = e && e.target ? e.target.querySelector('input[type="email"]') : null;
    const email = input ? input.value.trim() : '';

    const validation = App.validateEmail ? App.validateEmail(email) : { valid: true };
    if (!validation.valid) {
      if (App.Toast) App.Toast.show(validation.error);
      if (input) input.focus();
      return;
    }
    if (e && e.target && e.target.reset) e.target.reset();
    if (App.Toast) App.Toast.show('Done bhai! Jaise hi dates final honge pehle message kar dunga.');
  };
});
