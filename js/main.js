/**
 * Jitesh Bharti — Main Application Orchestrator
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
  if (App.ThankYouView) {
    App.ThankYouView.init();
  }

  // Global helper bindings for backward compatibility with HTML attributes
  window.showToast = (msg) => {
    if (App.Toast) App.Toast.show(msg);
  };

  window.openThankYou = () => {
    if (App.ThankYouView) App.ThankYouView.open();
  };

  window.openTicketModal = (city, date, venue, title, price) => {
    if (App.TicketModal) App.TicketModal.open({ city, date, venue, title, price });
  };

  window.handleTicketBooking = (e) => {
    if (App.TicketModal) App.TicketModal.handleSubmit(e);
  };

  window.handleTourNotify = (e) => {
    if (App.tourSection && typeof App.tourSection.handleTourNotify === 'function') {
      return App.tourSection.handleTourNotify(e);
    }
  };
});
