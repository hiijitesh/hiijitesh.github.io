/**
 * PoetryCard Component
 * Generates an elegant, hairline editorial folio row (zero box/square clutter).
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
    const row = document.createElement('article');
    row.className = 'poetry-row';
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-label', `${piece.title} — ${piece.category}`);

    const num = String(index + 1).padStart(2, '0');

    row.innerHTML = `
      <div class="row-left">
        <span class="row-num">${num}</span>
        <span class="row-cat">${escapeHtml(piece.category)}</span>
      </div>
      <div class="row-main">
        <h3 class="row-title">${escapeHtml(piece.title)}</h3>
        <p class="row-excerpt">"${escapeHtml(piece.excerpt)}"</p>
      </div>
      <div class="row-right">
        <span class="row-date">${escapeHtml(piece.date)}</span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </div>
    `;

    row.addEventListener('click', () => onCardClick(piece));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCardClick(piece);
      }
    });

    return row;
  }

  App.createPoetryCard = createPoetryCard;
  App.escapeHtml = escapeHtml;
})(window.App);
