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
      this.writings = App.defaultWritings || [];
      this.activeFilter = 'all';

      this.init();
    }

    async init() {
      this.setupFilters();
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

      const list = this.activeFilter === 'all'
        ? this.writings
        : this.writings.filter(w => w.category === this.activeFilter);

      // Empty condition state
      if (!list || list.length === 0) {
        this.renderEmptyState();
        return;
      }

      list.forEach((piece, index) => {
        const card = App.createPoetryCard(piece, index, (selected) => {
          if (App.ReaderModal) App.ReaderModal.open(selected);
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
