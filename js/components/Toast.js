/**
 * Toast Component
 * Manages transient bottom notifications.
 */
window.App = window.App || {};

(function(App) {
  class ToastComponent {
    constructor(elementId = 'toast') {
      this.elementId = elementId;
      this.timer = null;
    }

    get element() {
      return document.getElementById(this.elementId);
    }

    show(message, duration = 2800) {
      const el = this.element;
      if (!el) return;
      el.textContent = message;
      el.classList.add('show');
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        el.classList.remove('show');
      }, duration);
    }
  }

  App.Toast = new ToastComponent();
  window.Toast = App.Toast;
})(window.App);
