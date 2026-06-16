# Jitesh Giri — Personal Portfolio

> Sound Engineer · Beat Producer · Writer · Photographer

Live at **[hiijitesh.github.io](https://hiijitesh.github.io)**

---

## About

Personal portfolio website for **Jitesh Giri**, a multi-disciplinary creative based in Bangalore, India. The site showcases work across four domains:

- 🎛️ **Mixing & Mastering** — stereo engineering with a live A/B comparison player
- 🎵 **Beat Production** — licensable instrumentals with an interactive audio player
- ✍️ **Writing** — poetry, lyrics, and essays with a full-screen reader
- 📷 **Photography** — filterable masonry gallery with a lightbox viewer

---

## Tech Stack

| Layer | Choice |
|---|---|
| Markup | Vanilla HTML5 |
| Styling | Vanilla CSS3 (custom properties, CSS Grid, Flexbox) |
| Logic | Vanilla JavaScript (ES2020+, Web Audio API) |
| Fonts | Google Fonts — Syne, Plus Jakarta Sans, Outfit |
| Hosting | GitHub Pages |

No frameworks. No build step. No npm. Just push and it's live.

---

## Project Structure

```
hiijitesh.github.io/
├── index.html              # Main portfolio page
├── stylesheet.css          # Full design system & component styles
├── js/
│   └── main.js             # Audio players, gallery, writing loader, animations
├── audio/
│   ├── beat1.wav           # Cyberpunk Rhythm preview
│   ├── beat2.wav           # Lo-Fi Sunset preview
│   ├── beat3.wav           # Neon Trap Anthem preview
│   ├── mix_raw.wav         # Raw mix reference loop
│   └── mix_mastered.wav    # Mastered reference loop
├── data/
│   └── writings.json       # ← Add new writing pieces here
├── images/
│   └── photography/        # Portfolio photography
└── WRITING.md              # Guide for publishing new writing
```

---

## Publishing New Writing

Writing pieces are driven by [`data/writings.json`](data/writings.json). To publish a new piece, add an entry to the array:

```json
{
  "id": "unique-slug",
  "category": "Poetry",
  "title": "Piece Title",
  "date": "2026-06-16",
  "excerpt": "Short preview shown on the card.",
  "content": "Full text of the piece.\n\nNew paragraphs use two newlines."
}
```

Categories: `Poetry` · `Lyrics` · `Essay`

See [`WRITING.md`](WRITING.md) for the full guide.

---

## Features

- **Beat Player** — clickable track list with a sticky bottom player bar, progress scrubbing, and volume control
- **Mix/Master A/B Switcher** — two audio streams play in perfect sync; toggle flips between raw and mastered instantly
- **Photography Gallery** — category filters, masonry grid, fullscreen lightbox with keyboard navigation
- **Writing Reader** — JSON-driven cards with a clean distraction-free reading modal
- **Scroll Animations** — Intersection Observer fade-ins on all major blocks
- **Responsive** — mobile-optimised layouts across all sections

---

## Local Development

No build step required. Open directly in a browser:

```bash
# Option 1 — just open the file
open index.html

# Option 2 — serve with Python for fetch() to work (writing section)
python3 -m http.server 8000
# then visit http://localhost:8000
```

> ⚠️ The writing section uses `fetch('data/writings.json')`. Open via a local server (not `file://`) to avoid CORS issues in Chrome.

---

## Contact & Bookings

- 📧 [jiteshece@gmail.com](mailto:jiteshece@gmail.com)
- 📸 Instagram: [@jiteshxpro](https://instagram.com/jiteshxpro)
- 📍 Bangalore, India

---

© 2026 Jitesh Giri. All creative rights reserved.
