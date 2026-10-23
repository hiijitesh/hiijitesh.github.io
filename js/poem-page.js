/**
 * Standalone Poem Page Interactivity Controller
 * Handles view tracking, like toggling, heart animations, and Hindi/Hinglish switching.
 */
function initPoemPage(piece) {
  if (!piece) return;

  const viewsCountEl = document.getElementById('poem-views-count');
  const likeBtn = document.getElementById('reader-like-btn');
  const likesCountEl = document.getElementById('reader-likes-count');
  const likeIcon = document.getElementById('like-heart-icon');
  const bubbleContainer = document.getElementById('heart-bubble-container');
  const langToggleBtn = document.getElementById('poem-lang-toggle');
  const langLabel = document.getElementById('poem-lang-label');
  const titleEl = document.getElementById('poem-title') || document.getElementById('dyn-title');
  const contentEl = document.getElementById('poem-content') || document.getElementById('dyn-content');

  let isHindi = false;

  function cleanPoemBody(content, title) {
    if (!content) return '';
    const text = content.trim();
    if (!title) return text;
    const lines = text.split('\n');
    if (lines.length > 1 && lines[0].trim().toLowerCase() === title.trim().toLowerCase()) {
      lines.shift();
      while (lines.length > 0 && lines[0].trim() === '') {
        lines.shift();
      }
      return lines.join('\n');
    }
    return text;
  }

  // 1. Record View and Update Count Immediately
  if (window.App && window.App.Engagement) {
    const stats = window.App.Engagement.recordView(piece);
    if (viewsCountEl) viewsCountEl.textContent = stats.formattedViews;
    if (likesCountEl) likesCountEl.textContent = stats.formattedLikes;
    if (likeBtn) {
      if (stats.userLiked) {
        likeBtn.classList.add('liked');
      } else {
        likeBtn.classList.remove('liked');
      }
    }

    // Listen for server stats sync from Google Sheets
    window.App.Engagement.addSyncListener(() => {
      const freshStats = window.App.Engagement.getStats(piece);
      if (viewsCountEl) viewsCountEl.textContent = freshStats.formattedViews;
      if (likesCountEl) likesCountEl.textContent = freshStats.formattedLikes;
    });
  }

  // 2. Heart Bubble Animation
  function playHeartBubbleAnimation() {
    if (likeIcon) {
      likeIcon.classList.remove('pop');
      void likeIcon.offsetWidth;
      likeIcon.classList.add('pop');
    }

    if (!bubbleContainer) return;

    const colors = ['#ff3b5c', '#ff5277', '#ff7096', '#ffa8ba', '#ffb86c'];
    const heartSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

    const bubbleCount = 8;
    for (let i = 0; i < bubbleCount; i++) {
      const bubble = document.createElement('span');
      bubble.className = 'heart-bubble';
      bubble.innerHTML = heartSvg;

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

      bubbleContainer.appendChild(bubble);

      setTimeout(() => {
        if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
      }, 1250);
    }
  }

  // 3. Handle Like Button Click
  if (likeBtn && window.App && window.App.Engagement) {
    likeBtn.onclick = () => {
      const res = window.App.Engagement.toggleLike(piece);
      if (likesCountEl) likesCountEl.textContent = res.stats.formattedLikes;
      if (res.userLiked) {
        likeBtn.classList.add('liked');
        playHeartBubbleAnimation();
      } else {
        likeBtn.classList.remove('liked');
      }
    };
  }

  // 4. Handle Language Toggle (Hinglish <-> Hindi)
  if (langToggleBtn) {
    langToggleBtn.onclick = () => {
      isHindi = !isHindi;

      if (isHindi) {
        langToggleBtn.classList.add('active');
        if (titleEl) titleEl.textContent = piece.title_hi || piece.title;
        if (contentEl) {
          const hindiContent = piece.content_hi ? cleanPoemBody(piece.content_hi, piece.title_hi) : cleanPoemBody(piece.content, piece.title);
          contentEl.textContent = hindiContent;
        }
      } else {
        langToggleBtn.classList.remove('active');
        if (titleEl) titleEl.textContent = piece.title;
        if (contentEl) contentEl.textContent = cleanPoemBody(piece.content, piece.title);
      }
    };
  }
}

window.initPoemPage = initPoemPage;

document.addEventListener('DOMContentLoaded', () => {
  if (window.CURRENT_PIECE) {
    initPoemPage(window.CURRENT_PIECE);
  }
});

