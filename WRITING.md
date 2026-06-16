# ✍️ How to Post New Writing

All writing pieces live in **[`data/writings.json`](data/writings.json)**.
To publish something new, just add a new entry to that file, save, and push to GitHub.

---

## Adding a New Piece

Open `data/writings.json` and add a new object to the array. Copy this template:

```json
{
  "id": "your-unique-slug",
  "category": "Poetry",
  "title": "Your Title Here",
  "date": "2026-06-16",
  "excerpt": "A short teaser shown on the card (1–2 sentences max).",
  "content": "Full text of your piece.\n\nNew paragraphs use \\n\\n (two newlines).\n\nJust keep writing naturally here, as many paragraphs as you need."
}
```

### Fields

| Field | Required | Description |
|---|---|---|
| `id` | ✅ | Unique URL-safe slug (e.g. `"dark-frequencies"`) |
| `category` | ✅ | Must be one of: `"Poetry"`, `"Lyrics"`, `"Essay"` |
| `title` | ✅ | Display title shown on the card and in the reader |
| `date` | ✅ | ISO date string `"YYYY-MM-DD"` — used for sorting newest first |
| `excerpt` | ✅ | Short teaser shown on the card preview |
| `content` | ✅ | Full piece text. Use `\n\n` between paragraphs |

> **Tip:** Pieces are automatically sorted **newest first** by date.

---

## Example: Adding a New Poem

```json
[
  {
    "id": "dark-frequencies",
    "category": "Poetry",
    "title": "Dark Frequencies",
    "date": "2026-06-16",
    "excerpt": "Somewhere between 20Hz and 20kHz, the human ear draws a fence. Beyond it lies everything we feel but cannot name.",
    "content": "Dark Frequencies\n\nSomewhere between 20Hz and 20kHz, the human ear draws a fence. Beyond it lies everything we feel but cannot name.\n\nThe sub-bass that makes your sternum resonate at 2am. The shimmer of cymbals dissolving into digital air. These are the frequencies no EQ plugin charts, the ones that bypass the brain entirely and land directly in the chest.\n\nI produce beats for the body, not the mind."
  },
  ...existing entries...
]
```

---

## Adding a New Category

To add a new category (e.g. `"Script"` or `"Interview"`):

1. Add the new `"category"` value to your JSON entries.
2. Open [`index.html`](index.html) and add a new filter button inside the `#writing-filters` `<ul>`:

```html
<li><button class="filter-btn" data-writing-filter="Script" id="wf-script">Scripts</button></li>
```

That's it — no JS changes needed.

---

## Deploy

After editing `data/writings.json`, run:

```bash
git add data/writings.json
git commit -m "post: add new piece - [title]"
git push
```

Your writing will appear on the live site within ~60 seconds.
