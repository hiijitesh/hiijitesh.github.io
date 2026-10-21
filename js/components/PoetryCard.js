/**
 * PoetryCard Component
 * Generates an elegant, compact editorial card for poems, nazms, and shayari.
 */
window.App = window.App || {};

(function(App) {
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function createPoetryCard(piece, index = 0, onCardClick) {
    const card = document.createElement('article');
    card.className = 'poetry-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${piece.title} — ${piece.category}`);

    // Clean index number 01, 02, etc.
    const num = String(index + 1).padStart(2, '0');

    card.innerHTML = `
      <div class="p-card-body">
        <div class="p-card-meta">
          <span class="p-index">${num}</span>
          <span class="p-category">${escapeHtml(piece.category)}</span>
          <span class="p-meta-dot">•</span>
          <span class="p-date">${escapeHtml(piece.date)}</span>
        </div>
        <h3 class="p-title">${escapeHtml(piece.title)}</h3>
        <p class="p-excerpt">${escapeHtml(piece.excerpt)}</p>
      </div>
      <div class="p-read-btn">
        <span>Poora padho</span>
        <span class="arrow" aria-hidden="true">→</span>
      </div>
    `;

    card.addEventListener('click', () => onCardClick(piece));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCardClick(piece);
      }
    });

    return card;
  }

  App.createPoetryCard = createPoetryCard;
  App.escapeHtml = escapeHtml;
})(window.App);
