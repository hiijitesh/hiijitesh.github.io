/**
 * PoetrySection Component
 * Manages the poetry grid, category filter tabs, asynchronous data fetching, and reader modal integration.
 */
import { createPoetryCard } from './PoetryCard.js';
import { ReaderModal } from './ReaderModal.js';
import { defaultWritings } from '../data/defaultWritings.js';

export class PoetrySectionComponent {
  constructor() {
    this.grid = document.getElementById('poetry-grid');
    this.filterChips = document.querySelectorAll('.poetry-filters .p-filter');
    this.writings = defaultWritings;
    this.activeFilter = 'all';

    this.init();
  }

  async init() {
    this.setupFilters();
    await this.loadWritings();
    this.render();
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
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        this.writings = data;
      }
    } catch {
      // Graceful fallback to embedded writings
      this.writings = defaultWritings;
    }
  }

  render() {
    if (!this.grid) return;
    this.grid.innerHTML = '';

    const list = this.activeFilter === 'all'
      ? this.writings
      : this.writings.filter(w => w.category === this.activeFilter);

    list.forEach(piece => {
      const card = createPoetryCard(piece, (selected) => {
        ReaderModal.open(selected);
      });
      this.grid.appendChild(card);
    });
  }
}
