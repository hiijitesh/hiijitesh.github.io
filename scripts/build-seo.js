/**
 * SEO Page & Sitemap Generator for Jitesh Bharti (jiteshkumar.in)
 *
 * Generates:
 * 1. Dedicated pre-rendered HTML pages for each poem (/poetry/<id>/index.html)
 * 2. sitemap.xml for Google Search Console
 * 3. robots.txt
 *
 * Usage: node scripts/build-seo.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const WRITINGS_PATH = path.join(ROOT_DIR, 'data', 'writings.json');
const POETRY_DIR = path.join(ROOT_DIR, 'poetry');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');
const ROBOTS_PATH = path.join(ROOT_DIR, 'robots.txt');

const BASE_URL = 'https://jiteshkumar.in';
const AUTHOR_NAME = 'Jitesh Bharti';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_MAP = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
};

function formatPoetryDate(rawDate) {
  if (!rawDate) {
    const now = new Date();
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  }
  const str = String(rawDate).trim();
  const mNamed = str.match(/^([a-zA-Z]{3,9})\s+(\d{4})$/);
  if (mNamed && MONTH_MAP[mNamed[1].toLowerCase()] !== undefined) {
    return `${MONTHS[MONTH_MAP[mNamed[1].toLowerCase()]]} ${mNamed[2]}`;
  }
  const mSheets = str.match(/[a-zA-Z]{3}\s+([a-zA-Z]{3})\s+\d{1,2}\s+(\d{4})/);
  if (mSheets && MONTH_MAP[mSheets[1].toLowerCase()] !== undefined) {
    return `${MONTHS[MONTH_MAP[mSheets[1].toLowerCase()]]} ${mSheets[2]}`;
  }
  const mIso = str.match(/^(\d{4})[-/](\d{1,2})/);
  if (mIso) {
    const mIdx = parseInt(mIso[2], 10) - 1;
    if (mIdx >= 0 && mIdx < 12) return `${MONTHS[mIdx]} ${mIso[1]}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }
  return str;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cleanExcerpt(content, title) {
  if (!content) return '';
  const lines = content.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && l.toLowerCase() !== (title || '').toLowerCase());
  return lines.slice(0, 4).join(', ') + '...';
}

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

function normalizePoemItem(p, idx) {
  if (!p || typeof p !== 'object') return null;

  let id = String(p.id || '').trim();
  let category = String(p.category || 'Poetry').trim();
  let title = String(p.title || '').trim();
  let titleHi = String(p.title_hi || '').trim();
  let date = String(p.date || '').trim();
  let excerpt = String(p.excerpt || '').trim();
  let content = String(p.content || '').trim();
  let contentHi = String(p.content_hi || '').trim();
  let views = Number(p.views) || 0;
  let likes = Number(p.likes) || 0;

  // Detect if raw server object has shifted columns
  const isShifted = (id.includes('\n') || id.length > 70) && 
                    (title && !title.includes('\n') && title.length <= 60);

  if (isShifted) {
    const shiftedContent = id;
    const shiftedContentHi = category;
    const shiftedId = title;
    const shiftedCategory = titleHi;
    const shiftedTitle = date;
    const shiftedTitleHi = excerpt;
    const shiftedDate = content;
    const shiftedExcerpt = contentHi;

    id = shiftedId;
    category = shiftedCategory || 'Poetry';
    title = shiftedTitle;
    titleHi = shiftedTitleHi;
    date = shiftedDate;
    excerpt = shiftedExcerpt;
    content = shiftedContent;
    contentHi = shiftedContentHi;
  }

  if (!id && title) {
    id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (!id) {
    id = `poem-${idx + 1}`;
  }

  if (!excerpt && content) {
    const cleanLines = content.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && l.toLowerCase() !== title.toLowerCase());
    excerpt = cleanLines.slice(0, 2).join(' ') + '...';
  }

  return {
    id: id,
    category: category,
    title: title || id,
    title_hi: titleHi,
    date: formatPoetryDate(date),
    excerpt: excerpt,
    content: content,
    content_hi: contentHi,
    views: views,
    likes: likes
  };
}

function generatePoemHtml(piece) {
  const canonicalUrl = `${BASE_URL}/poetry/${piece.id}/`;
  const cleanBody = cleanPoemBody(piece.content, piece.title);
  const cleanBodyHi = piece.content_hi ? cleanPoemBody(piece.content_hi, piece.title_hi) : cleanBody;
  const metaDesc = piece.excerpt || cleanExcerpt(piece.content, piece.title);
  const titleTag = `${piece.title} — ${AUTHOR_NAME} | Hindi ${piece.category}`;
  const keywords = `${piece.title}, ${piece.title_hi || ''}, ${AUTHOR_NAME}, Jitesh Kumar, Hindi Poetry, Hindi Shayari, Hindi Nazm, Poetry in Hindi, Hinglish Poetry, Kavita, ${piece.category}`;

  const schemaJson = {
    "@context": "https://schema.org",
    "@type": ["CreativeWork", "Poem"],
    "name": piece.title,
    "alternateName": piece.title_hi || undefined,
    "headline": piece.title,
    "description": metaDesc,
    "text": piece.content,
    "author": {
      "@type": "Person",
      "name": AUTHOR_NAME,
      "url": BASE_URL,
      "sameAs": [
        "https://instagram.com/hiijitesh",
        "https://github.com/hiijitesh"
      ]
    },
    "genre": piece.category,
    "inLanguage": ["hi", "hi-Latn", "en"],
    "datePublished": formatPoetryDate(piece.date),
    "mainEntityOfPage": canonicalUrl,
    "publisher": {
      "@type": "Person",
      "name": AUTHOR_NAME,
      "url": BASE_URL
    }
  };

  return `<!DOCTYPE html>
<html lang="hi-Latn" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta Tags -->
  <title>${escapeHtml(titleTag)}</title>
  <meta name="title" content="${escapeHtml(titleTag)}">
  <meta name="description" content="${escapeHtml(metaDesc)}">
  <meta name="keywords" content="${escapeHtml(keywords)}">
  <meta name="author" content="${escapeHtml(AUTHOR_NAME)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${escapeHtml(AUTHOR_NAME)} — Poet & Storyteller">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${escapeHtml(piece.title)} — ${escapeHtml(AUTHOR_NAME)}">
  <meta property="og:description" content="${escapeHtml(metaDesc)}">
  <meta property="og:image" content="${BASE_URL}/images/jitesh.jpg">
  <meta property="og:locale" content="hi_IN">
  <meta property="article:author" content="${escapeHtml(AUTHOR_NAME)}">
  <meta property="article:section" content="${escapeHtml(piece.category)}">

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${escapeHtml(piece.title)} — ${escapeHtml(AUTHOR_NAME)}">
  <meta name="twitter:description" content="${escapeHtml(metaDesc)}">
  <meta name="twitter:image" content="${BASE_URL}/images/jitesh.jpg">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="../../favicon.ico">
  <link rel="icon" type="image/png" href="../../images/favicon.png">

  <!-- Google Fonts Preconnect -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Outfit:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Rozha+One&display=swap" rel="stylesheet">

  <!-- Main Stylesheet -->
  <link rel="stylesheet" href="../../stylesheet.css?v=30">

  <!-- Schema.org Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(schemaJson, null, 2)}
  </script>
</head>
<body class="poem-standalone-body">

  <!-- Navigation Bar (Sticky with Back Link on left & Translate on right) -->
  <header class="poem-page-nav">
    <div class="container poem-nav-container">
      <a href="../../" class="poem-back-link" title="Return to home archive">
        <span class="back-arrow" aria-hidden="true">←</span>
        <span class="back-text"><strong>${escapeHtml(AUTHOR_NAME)}</strong> / All Writings</span>
      </a>

      <!-- Translate Button on Top Right (Sticky Navbar) -->
      <div class="poem-header-actions">
        <button class="reader-lang-toggle" id="poem-lang-toggle" type="button" title="Switch Hindi / English" aria-label="Toggle language">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m5 8 6 6"/>
            <path d="m4 14 6-6 2-3"/>
            <path d="M2 5h12"/>
            <path d="M7 2h1"/>
            <path d="m22 22-5-10-5 10"/>
            <path d="M14 18h6"/>
          </svg>
          <span id="poem-lang-label">Hindi / English</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Poem Content -->
  <main class="container poem-page-main">
    <article class="poem-article">
      <div class="poem-meta-bar">
        <span class="poem-category-tag">${escapeHtml(piece.category)}</span>
        <span class="poem-date-tag">${escapeHtml(formatPoetryDate(piece.date))}</span>
      </div>

      <h1 class="poem-title" id="poem-title">${escapeHtml(piece.title)}</h1>

      <div class="poem-content" id="poem-content">${escapeHtml(cleanBody)}</div>

      <!-- Bottom Interaction / Engagement Bar (Views & Likes) -->
      <div class="poem-bottom-actions">
        <!-- Views Count Pill -->
        <span class="poem-views-pill" title="Total reads">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span id="poem-views-count">${piece.views || 0}</span>
        </span>

        <!-- Like Button -->
        <button class="reader-like-btn" id="reader-like-btn" type="button" aria-label="Like this poem" title="Dil se like karein">
          <span class="like-heart-icon" id="like-heart-icon" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </span>
          <span class="like-count" id="reader-likes-count">${piece.likes || 0}</span>
          <span class="heart-bubble-container" id="heart-bubble-container" aria-hidden="true"></span>
        </button>
      </div>
    </article>

    <!-- Footer Author / Navigation Card -->
    <div class="poem-footer-cta">
      <div class="poem-author-card">
        <img src="../../images/jitesh.jpg" alt="${escapeHtml(AUTHOR_NAME)}" class="poem-author-avatar" width="48" height="48" loading="lazy">
        <div class="poem-author-info">
          <h4>${escapeHtml(AUTHOR_NAME)}</h4>
          <p>Poet & Storyteller &bull; Pure dil se likha hua</p>
        </div>
      </div>
      <a href="../../" class="btn btn-secondary">Explore All Poems & Nazms &rarr;</a>
    </div>
  </main>

  <!-- Site Footer -->
  <footer class="site-footer">
    <div class="container footer-container">
      <p class="footer-text">&copy; 2026 ${escapeHtml(AUTHOR_NAME)}. All rights reserved.</p>
      <a href="https://instagram.com/hiijitesh" target="_blank" rel="noopener" class="footer-insta-link" title="Instagram @hiijitesh">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
        </svg>
        <span>Instagram</span>
      </a>
    </div>
  </footer>

  <!-- Scripts -->
  <script>
    window.ENGAGEMENT_API_URL = "https://script.google.com/macros/s/AKfycbx4yq-WGnp4bl7tPjaoge6mj-oluJupxcHjZcCKgcX2T_JFpRT5xv8h124azfJ0U7iL/exec";
    window.CURRENT_PIECE = ${JSON.stringify(piece)};
  </script>
  <script src="../../js/utils/transliterator.js?v=30"></script>
  <script src="../../js/utils/engagement.js?v=30"></script>
  <script src="../../js/poem-page.js?v=30"></script>
</body>
</html>
`;
}

function generateSitemap(writings) {
  const today = new Date().toISOString().split('T')[0];
  const urls = [
    `  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`
  ];

  writings.forEach(w => {
    urls.push(`  <url>
    <loc>${BASE_URL}/poetry/${w.id}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

function generateRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
}

async function fetchLivePoetry() {
  const apiUrl = "https://script.google.com/macros/s/AKfycbx4yq-WGnp4bl7tPjaoge6mj-oluJupxcHjZcCKgcX2T_JFpRT5xv8h124azfJ0U7iL/exec?action=get_poetry";
  try {
    const res = await fetch(apiUrl, { method: 'GET', redirect: 'follow' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success' && Array.isArray(data.poetry)) {
        return data.poetry;
      }
    }
  } catch (err) {
    console.warn('  ⚠️ Could not fetch live Google Sheets poetry during build, using local writings:', err.message);
  }
  return [];
}

async function main() {
  console.log('🚀 Starting SEO build...');

  let writings = [];
  if (fs.existsSync(WRITINGS_PATH)) {
    try {
      writings = JSON.parse(fs.readFileSync(WRITINGS_PATH, 'utf-8'));
    } catch {}
  }

  // Fetch live poems from Google Sheets
  const livePoems = await fetchLivePoetry();
  if (livePoems.length > 0) {
    writings = livePoems;
  }

  // Normalize writings (handles shifted layout or new dynamic headers seamlessly)
  writings = writings.map((p, idx) => normalizePoemItem(p, idx)).filter(Boolean);

  if (!Array.isArray(writings) || writings.length === 0) {
    console.error('Error: No writings found to build');
    process.exit(1);
  }

  // Update data/writings.json cache with authoritative sheet content
  fs.writeFileSync(WRITINGS_PATH, JSON.stringify(writings, null, 2), 'utf-8');
  console.log(`  ✓ Synced ${writings.length} live poems from Google Sheet into data/writings.json`);

  // Ensure poetry directory exists
  if (!fs.existsSync(POETRY_DIR)) {
    fs.mkdirSync(POETRY_DIR, { recursive: true });
  }

  // Generate each poem's page
  writings.forEach((piece, idx) => {
    let slug = String(piece.id || '').trim();
    if (slug.includes('\n') || slug.length > 60) {
      if (piece.title && !piece.title.includes('\n') && piece.title.length <= 60) {
        slug = piece.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      } else {
        slug = slug.split('\n')[0].slice(0, 40).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    }
    if (!slug) slug = `poem-${idx + 1}`;
    piece.id = slug;

    const poemDir = path.join(POETRY_DIR, slug);
    if (!fs.existsSync(poemDir)) {
      fs.mkdirSync(poemDir, { recursive: true });
    }
    const htmlContent = generatePoemHtml(piece);
    const filePath = path.join(poemDir, 'index.html');
    fs.writeFileSync(filePath, htmlContent, 'utf-8');
    console.log(`  ✓ Generated /poetry/${slug}/index.html`);
  });

  // Generate sitemap.xml
  const sitemapContent = generateSitemap(writings);
  fs.writeFileSync(SITEMAP_PATH, sitemapContent, 'utf-8');
  console.log(`  ✓ Generated sitemap.xml (${writings.length + 1} URLs)`);

  // Generate robots.txt
  const robotsContent = generateRobots();
  fs.writeFileSync(ROBOTS_PATH, robotsContent, 'utf-8');
  console.log(`  ✓ Generated robots.txt`);

  console.log('✨ SEO build completed successfully!');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
