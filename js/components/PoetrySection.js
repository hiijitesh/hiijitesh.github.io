/**
 * PoetrySection Component
 * Manages the poetry grid, category filter tabs, asynchronous data fetching,
 * empty conditions state, and reader modal integration.
 */
window.App = window.App || {};

(function(App) {
  class PoetrySectionComponent {
    constructor() {
      this.grid = document.getElementById('poetry-grid');
      this.filterChips = document.querySelectorAll('.poetry-filters .p-filter');
      this.sortButtons = document.querySelectorAll('.poetry-sort .p-sort-btn');
      this.writings = App.defaultWritings || [];
      this.activeFilter = 'all';
      this.activeSort = 'views'; // Default sort by views

      this.init();
    }

    async init() {
      this.setupFilters();
      this.setupSorting();
      // Render immediate default writings so page is never empty
      this.render();
      // Try to load any updated writings from JSON
      await this.loadWritings();
    }

    setupFilters() {
      this.filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
          this.filterChips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.activeFilter = chip.getAttribute('data-wfilter') || 'all';
          this.render();
        });
      });
    }

    setupSorting() {
      this.sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.sortButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeSort = btn.getAttribute('data-sort') || 'views';
          this.render();
        });
      });
    }

    async loadWritings() {
      try {
        const res = await fetch(`data/writings.json?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            this.writings = data;
            this.render();
          }
        }
      } catch {
        // Offline / file:// protocol fallback already rendered
      }
    }

    render() {
      if (!this.grid) return;
      this.grid.innerHTML = '';

      let list = this.activeFilter === 'all'
        ? [...this.writings]
        : this.writings.filter(w => w.category === this.activeFilter);

      // Sort by views (highest views first) or recent archive order
      if (this.activeSort === 'views') {
        list.sort((a, b) => {
          const vA = App.Engagement ? App.Engagement.getStats(a).views : (Number(a.views) || 0);
          const vB = App.Engagement ? App.Engagement.getStats(b).views : (Number(b.views) || 0);
          return vB - vA;
        });
      }

      // Empty condition state
      if (!list || list.length === 0) {
        this.renderEmptyState();
        return;
      }

      list.forEach((piece, index) => {
        const card = App.createPoetryCard(piece, index, (selected) => {
          if (App.ReaderModal) {
            App.ReaderModal.open(selected, () => {
              // Refresh counts on card row when engagement updates
              this.render();
            });
          }
        });
        this.grid.appendChild(card);
      });
    }

    renderEmptyState() {
      const isFiltered = this.activeFilter !== 'all';
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'poetry-empty-state';
      emptyDiv.innerHTML = `
        <div class="empty-icon-wrap" aria-hidden="true">✍️</div>
        <h3 class="empty-title">Abhi yahan kuch likha nahi hai bhai</h3>
        <p class="empty-desc">
          ${isFiltered 
            ? `"${this.activeFilter}" category mein abhi koi piece nahi hai. Bahut jaldi nayi nazm/kavita likhunga.`
            : 'Kalam chal rahi hai, jaise hi koi nayi rachna poori hogi yahan sabse pehle aayegi.'}
        </p>
        ${isFiltered ? '<button type="button" class="empty-reset-btn" id="empty-reset-btn">Sabhi rachnayein dekho</button>' : ''}
      `;

      if (isFiltered) {
        const resetBtn = emptyDiv.querySelector('#empty-reset-btn');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            const allChip = document.querySelector('.poetry-filters .p-filter[data-wfilter="all"]');
            if (allChip) allChip.click();
          });
        }
      }

      this.grid.appendChild(emptyDiv);
    }
  }

  App.PoetrySectionComponent = PoetrySectionComponent;
})(window.App);
