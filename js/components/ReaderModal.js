/**
 * ReaderModal Component
 * Handles the full-screen poem reader overlay with title deduplication,
 * escape handling, and live Hinglish / Hindi language toggle.
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
      this.langBtn = null;
      this.langLabel = null;
      this.currentPiece = null;
      this.isHindi = false;
      this.hindiTitle = '';
      this.hindiBody = '';
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
      this.langBtn = document.getElementById('reader-lang-toggle');
      this.langLabel = document.getElementById('reader-lang-label');

      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.close());
      }
      if (this.modal) {
        this.modal.addEventListener('click', (e) => {
          if (e.target === this.modal) this.close();
        });
      }
      if (this.langBtn) {
        this.langBtn.addEventListener('click', () => this.toggleLanguage());
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

      const normalize = str => (str || '').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
      const titleNorm = normalize(title);
      if (!titleNorm) return text;

      const lines = text.split('\n');
      if (lines.length > 1) {
        const firstLineNorm = normalize(lines[0]);
        if (firstLineNorm && firstLineNorm === titleNorm) {
          lines.shift();
          while (lines.length > 0 && lines[0].trim() === '') {
            lines.shift();
          }
          return lines.join('\n');
        }
      }
      return text;
    }

    async toggleLanguage() {
      if (!this.currentPiece) return;
      this.isHindi = !this.isHindi;

      if (this.isHindi) {
        if (this.langBtn) this.langBtn.classList.add('active');
        if (this.langLabel) this.langLabel.textContent = 'हिं';

        // 1. Prioritize authentic author-written Hindi title
        if (!this.hindiTitle) {
          if (this.currentPiece.title_hi) {
            this.hindiTitle = this.currentPiece.title_hi;
          } else if (App.hinglishToHindi) {
            this.hindiTitle = await App.hinglishToHindi(this.currentPiece.title);
          } else if (App.hinglishToHindiSync) {
            this.hindiTitle = App.hinglishToHindiSync(this.currentPiece.title);
          } else {
            this.hindiTitle = this.currentPiece.title;
          }
        }

        // 2. Prioritize authentic author-written Hindi body
        if (!this.hindiBody) {
          if (this.currentPiece.content_hi) {
            this.hindiBody = this.cleanPoemBody(this.currentPiece.content_hi, this.currentPiece.title_hi);
          } else {
            const rawBody = this.cleanPoemBody(this.currentPiece.content, this.currentPiece.title);
            if (App.hinglishToHindi) {
              this.hindiBody = await App.hinglishToHindi(rawBody);
            } else if (App.hinglishToHindiSync) {
              this.hindiBody = App.hinglishToHindiSync(rawBody);
            } else {
              this.hindiBody = rawBody;
            }
          }
        }

        if (this.heading) this.heading.textContent = this.hindiTitle;
        if (this.text) this.text.textContent = this.hindiBody;
      } else {
        if (this.langBtn) this.langBtn.classList.remove('active');
        if (this.langLabel) this.langLabel.textContent = 'Eng';

        if (this.heading) this.heading.textContent = this.currentPiece.title;
        if (this.text) this.text.textContent = this.cleanPoemBody(this.currentPiece.content, this.currentPiece.title);
      }
    }

    async open(piece) {
      this.init();
      if (!this.modal || !piece) return;
      this.currentPiece = piece;
      const startHindi = !!piece.isHindi;
      this.isHindi = false;
      this.hindiTitle = piece.title_hi || '';
      this.hindiBody = piece.content_hi ? this.cleanPoemBody(piece.content_hi, piece.title_hi) : '';

      if (this.category) this.category.textContent = piece.category;
      if (this.heading) this.heading.textContent = piece.title;
      if (this.text) this.text.textContent = this.cleanPoemBody(piece.content, piece.title);
      if (this.canvas) this.canvas.scrollTop = 0;

      if (this.langBtn) {
        this.langBtn.classList.remove('active');
        this.langLabel.textContent = 'A / अ';
      }

      if (startHindi) {
        await this.toggleLanguage();
      }

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
