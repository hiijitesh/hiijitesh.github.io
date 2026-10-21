/**
 * Toast Component
 * Manages transient bottom notifications.
 */
export class ToastComponent {
  constructor(elementId = 'toast') {
    this.toast = document.getElementById(elementId);
    this.timer = null;
  }

  show(message, duration = 2800) {
    if (!this.toast) return;
    this.toast.textContent = message;
    this.toast.classList.add('show');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.toast.classList.remove('show');
    }, duration);
  }
}

export const Toast = new ToastComponent();
