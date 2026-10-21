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
      this.viewsCount = null;
      this.likeBtn = null;
      this.likeIcon = null;
      this.likesCount = null;
      this.bubbleContainer = null;
      this.currentPiece = null;
      this.isHindi = false;
      this.hindiTitle = '';
      this.hindiBody = '';
      this.onUpdate = null;
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
      this.viewsCount = document.getElementById('reader-views-count');
      this.likeBtn = document.getElementById('reader-like-btn');
      this.likeIcon = document.getElementById('like-heart-icon');
      this.likesCount = document.getElementById('reader-likes-count');
      this.bubbleContainer = document.getElementById('heart-bubble-container');

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
      if (this.likeBtn) {
        this.likeBtn.addEventListener('click', () => this.handleLikeClick());
      }
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });

      // Update active reader modal live when server sync arrives
      if (App.Engagement) {
        const prevSync = App.Engagement.onServerSync;
        App.Engagement.onServerSync = (stats) => {
          if (this.isOpen() && this.currentPiece) {
            const currentStats = App.Engagement.getStats(this.currentPiece);
            if (this.viewsCount) this.viewsCount.textContent = currentStats.formattedViews;
            if (this.likesCount) this.likesCount.textContent = currentStats.formattedLikes;
          }
          if (typeof prevSync === 'function') prevSync(stats);
        };
      }

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

    handleLikeClick() {
      if (!this.currentPiece || !App.Engagement) return;
      const res = App.Engagement.toggleLike(this.currentPiece);
      
      if (this.likesCount) {
        this.likesCount.textContent = res.stats.formattedLikes;
      }

      if (res.userLiked) {
        if (this.likeBtn) this.likeBtn.classList.add('liked');
        this.playHeartBubbleAnimation();
      } else {
        if (this.likeBtn) this.likeBtn.classList.remove('liked');
      }

      if (typeof this.onUpdate === 'function') {
        this.onUpdate();
      }
    }

    playHeartBubbleAnimation() {
      if (this.likeIcon) {
        this.likeIcon.classList.remove('pop');
        void this.likeIcon.offsetWidth; // Reflow for re-triggering animation
        this.likeIcon.classList.add('pop');
      }

      if (!this.bubbleContainer) return;

      const colors = ['#ff3b5c', '#ff5277', '#ff7096', '#ffa8ba', '#ffb86c'];
      const heartSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

      const bubbleCount = 8;
      for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('span');
        bubble.className = 'heart-bubble';
        bubble.innerHTML = heartSvg;

        // Randomized upward trajectories and sway
        const dx = (Math.random() * 56 - 28).toFixed(1) + 'px';
        const dy = (-(Math.random() * 50 + 55)).toFixed(1) + 'px';
        const rot = (Math.random() * 50 - 25).toFixed(1) + 'deg';
        const scale = (Math.random() * 0.4 + 0.75).toFixed(2);
        const duration = (Math.random() * 300 + 750).toFixed(0) + 'ms';
        const delay = (i * 40) + 'ms';
        const color = colors[i % colors.length];

        bubble.style.setProperty('--dx', dx);
        bubble.style.setProperty('--dy', dy);
        bubble.style.setProperty('--rot', rot);
        bubble.style.setProperty('--bubble-scale', scale);
        bubble.style.setProperty('--bubble-color', color);
        bubble.style.animationDuration = duration;
        bubble.style.animationDelay = delay;

        this.bubbleContainer.appendChild(bubble);

        setTimeout(() => {
          if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
        }, 1250);
      }
    }

    async open(piece, onUpdate) {
      this.init();
      if (!this.modal || !piece) return;
      this.currentPiece = piece;
      this.onUpdate = onUpdate || null;

      const startHindi = !!piece.isHindi;
      this.isHindi = false;
      this.hindiTitle = piece.title_hi || '';
      this.hindiBody = piece.content_hi ? this.cleanPoemBody(piece.content_hi, piece.title_hi) : '';

      // Record read/view and fetch latest stats
      const stats = App.Engagement ? App.Engagement.recordView(piece) : {
        formattedViews: String(piece.views || 0),
        formattedLikes: String(piece.likes || 0),
        userLiked: false
      };

      if (this.viewsCount) {
        this.viewsCount.textContent = stats.formattedViews;
      }
      if (this.likesCount) {
        this.likesCount.textContent = stats.formattedLikes;
      }
      if (this.likeBtn) {
        if (stats.userLiked) {
          this.likeBtn.classList.add('liked');
        } else {
          this.likeBtn.classList.remove('liked');
        }
      }

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

      // Notify parent list if view count updated
      if (typeof this.onUpdate === 'function') {
        this.onUpdate();
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
