/**
 * ReaderModal Component
 * Handles the full-screen poem reader overlay with title deduplication and escape handling.
 */
window.App = window.App || {};

(function(App) {
  class ReaderModalComponent {
    constructor() {
      this.modal = null;
      this.heading = null;
      this.category = null;
      this.text = null;
      this.canvas = null;
      this.closeBtn = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      this.modal = document.getElementById('reader-modal');
      this.heading = document.getElementById('reader-heading');
      this.category = document.getElementById('reader-cat');
      this.text = document.getElementById('reader-text');
      this.canvas = this.modal ? this.modal.querySelector('.reader-canvas') : null;
      this.closeBtn = document.getElementById('reader-close');

      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.close());
      }
      if (this.modal) {
        this.modal.addEventListener('click', (e) => {
          if (e.target === this.modal) this.close();
        });
      }
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });
      this.initialized = true;
    }

    cleanPoemBody(content, title) {
      if (!content) return '';
      const text = content.trim();
      if (!title) return text;

      const normalize = str => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      const titleNorm = normalize(title);

      const lines = text.split('\n');
      if (lines.length > 1) {
        const firstLineNorm = normalize(lines[0]);
        if (firstLineNorm === titleNorm) {
          const nextNonEmpty = lines.slice(1).find(l => l.trim() !== '') || '';
          const nextNorm = normalize(nextNonEmpty);
          if (lines[1].trim() === '' || nextNorm.startsWith(titleNorm.slice(0, 8))) {
            lines.shift();
            while (lines.length > 0 && lines[0].trim() === '') {
              lines.shift();
            }
            return lines.join('\n');
          }
        }
      }
      return text;
    }

    open(piece) {
      this.init();
      if (!this.modal || !piece) return;
      if (this.category) this.category.textContent = piece.category;
      if (this.heading) this.heading.textContent = piece.title;
      if (this.text) this.text.textContent = this.cleanPoemBody(piece.content, piece.title);
      if (this.canvas) this.canvas.scrollTop = 0;
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
  }

  App.ReaderModal = new ReaderModalComponent();
  window.ReaderModal = App.ReaderModal;
})(window.App);
