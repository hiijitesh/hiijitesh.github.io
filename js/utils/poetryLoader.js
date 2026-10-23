/**
 * Poetry Loader Service
 * Fetches poetry exclusively from Google Sheets (Poetry tab) via the Apps Script API.
 * Uses localStorage caching for instant load and revalidates live against the sheet.
 *
 * Automatically formats sheet date entries into "Oct 2026" (Mon YYYY) format.
 */
window.App = window.App || {};

(function(App) {
  'use strict';

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTH_MAP = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };

  /**
   * Helper to format any date input (Date object, timestamp, ISO string, Sheets date string)
   * into clean "Oct 2026" (Mon YYYY) format.
   * Safe against timezone boundary shifts.
   */
  function formatPoetryDate(rawDate) {
    if (rawDate === null || rawDate === undefined || rawDate === '') {
      const now = new Date();
      return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    }

    // 1. Native Date objects
    if (rawDate instanceof Date || Object.prototype.toString.call(rawDate) === '[object Date]') {
      if (!isNaN(rawDate.getTime())) {
        return `${MONTHS[rawDate.getMonth()]} ${rawDate.getFullYear()}`;
      }
    }

    // 2. Numeric timestamps
    if (typeof rawDate === 'number' && !isNaN(rawDate)) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      }
    }

    const str = String(rawDate).trim();
    if (!str) {
      const now = new Date();
      return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    }

    // 3. Already "Mon YYYY" or "Month YYYY" e.g. "Oct 2026", "October 2026"
    const mNamed = str.match(/^([a-zA-Z]{3,9})\s+(\d{4})$/);
    if (mNamed) {
      const idx = MONTH_MAP[mNamed[1].toLowerCase()];
      if (idx !== undefined) {
        return `${MONTHS[idx]} ${mNamed[2]}`;
      }
    }

    // 4. Google Sheets / JavaScript toString: "Thu Oct 01 2026 00:00:00 GMT+0530..."
    const mSheets = str.match(/[a-zA-Z]{3}\s+([a-zA-Z]{3})\s+\d{1,2}\s+(\d{4})/);
    if (mSheets) {
      const idx = MONTH_MAP[mSheets[1].toLowerCase()];
      if (idx !== undefined) {
        return `${MONTHS[idx]} ${mSheets[2]}`;
      }
    }

    // 5. ISO / YYYY-MM-DD or YYYY-MM e.g. "2026-10-01", "2026-10" (avoid UTC timezone shift)
    const mIso = str.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/);
    if (mIso) {
      const year = mIso[1];
      const monthIdx = parseInt(mIso[2], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${MONTHS[monthIdx]} ${year}`;
      }
    }

    // 6. MM-YYYY or MM/YYYY e.g. "10-2026", "10/2026"
    const mMonthYear = str.match(/^(\d{1,2})[-/](\d{4})$/);
    if (mMonthYear) {
      const monthIdx = parseInt(mMonthYear[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${MONTHS[monthIdx]} ${mMonthYear[2]}`;
      }
    }

    // 7. General Date parsing fallback
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    }

    return str;
  }

  // Export helper globally so PoetryCard can also use it
  App.formatPoetryDate = formatPoetryDate;

  class PoetryLoaderService {
    constructor() {
      this.apiEndpoint = null;
      this.poems = [];
      this.hasFetched = false;
      this.isFetching = false;
      this._fetchPromise = null;
      this.listeners = [];
      this.fetchError = null;
    }

    /**
     * Initialize with the configured API endpoint.
     * Preserves already fetched poems if called again.
     */
    init(customEndpoint) {
      this.apiEndpoint = customEndpoint || this.apiEndpoint || window.ENGAGEMENT_API_URL || null;

      // Try reading from localStorage cache first so returning visitors see latest sheet poems instantly
      if (!this.hasFetched && this.poems.length === 0) {
        try {
          if (typeof localStorage !== 'undefined') {
            const cached = localStorage.getItem('jb_poetry_cache');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                this.poems = parsed.map(p => ({
                  ...p,
                  date: formatPoetryDate(p.date)
                }));
              }
            }
          }
        } catch (e) {}
      }
    }

    /**
     * Register a callback to be called whenever poems are updated
     * @param {Function} fn - Receives the poems array
     */
    addListener(fn) {
      if (typeof fn === 'function') {
        this.listeners.push(fn);
        if (this.hasFetched) {
          try { fn(this.poems); } catch(e) { console.error(e); }
        }
      }
    }

    /**
     * Notify all listeners with the current poems array
     */
    _notifyListeners() {
      const poems = this.poems;
      this.listeners.forEach(fn => {
        try { fn(poems); } catch(e) { console.error(e); }
      });
    }

    /**
     * Get the current poems array (synchronous)
     * @returns {Array}
     */
    getPoems() {
      return this.poems;
    }

    /**
     * Build the full URL with query params for the API call
     */
    _buildUrl(action) {
      const endpoint = this.apiEndpoint;
      try {
        const urlObj = new URL(endpoint, (window.location && window.location.href) || 'https://localhost');
        urlObj.searchParams.set('action', action);
        urlObj.searchParams.set('_t', String(Date.now()));
        return urlObj.toString();
      } catch {
        const sep = endpoint.includes('?') ? '&' : '?';
        return `${endpoint}${sep}action=${encodeURIComponent(action)}&_t=${Date.now()}`;
      }
    }

    /**
     * Fetch poems from Google Sheets via Apps Script
     * Uses direct GET with follow redirects (simple CORS request, no preflight OPTIONS needed).
     * Coalesces concurrent calls into a single in-flight promise.
     */
    async fetchFromSheet() {
      if (!this.apiEndpoint) return this.poems;

      // If already in flight, return the existing promise
      if (this.isFetching && this._fetchPromise) {
        return this._fetchPromise;
      }

      // Don't attempt fetch on file:// protocol
      if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
        console.info('[PoetryLoader] Running on file:// protocol.');
        return this.poems;
      }

      this.isFetching = true;
      this.fetchError = null;

      this._fetchPromise = (async () => {
        const targetUrl = this._buildUrl('get_poetry');
        console.info('[PoetryLoader] Fetching poems from:', targetUrl);

        // Primary: Simple GET request (Apps Script redirects cleanly without CORS preflight block)
        try {
          const res = await fetch(targetUrl, {
            method: 'GET',
            redirect: 'follow'
          });

          if (res.ok) {
            const data = await res.json();
            console.info('[PoetryLoader] GET Response:', data);

            if (data && data.status === 'success' && Array.isArray(data.poetry)) {
              this._mergeAndUpdate(data.poetry);
              return this.poems;
            }
          }
        } catch (err) {
          console.warn('[PoetryLoader] GET failed, trying POST fallback:', err.message || err);
        }

        // Secondary fallback: POST with text/plain
        try {
          const payload = JSON.stringify({ action: 'get_poetry' });
          const res = await fetch(targetUrl, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            redirect: 'follow'
          });

          if (res.ok) {
            const data = await res.json();
            if (data && data.status === 'success' && Array.isArray(data.poetry)) {
              this._mergeAndUpdate(data.poetry);
              return this.poems;
            }
          }
        } catch (err) {
          this.fetchError = err;
          console.warn('[PoetryLoader] Fetch from sheet failed:', err.message || err);
        }

        return this.poems;
      })().finally(() => {
        this.isFetching = false;
        this._fetchPromise = null;
      });

      return this._fetchPromise;
    }

    /**
     * Update poems strictly from Google Sheet and notify listeners.
     * Formats all dates to "Oct 2026" (Mon YYYY).
     * Google Sheet is the authoritative single source of truth:
     * Does NOT merge or re-inject hardcoded default writings.
     * Content corrections, revisions, edits, drafts, or deletions made in
     * the Google Sheet are directly reflected on the website.
     * @param {Array} serverPoems
     */
    _mergeAndUpdate(serverPoems) {
      if (Array.isArray(serverPoems) && serverPoems.length > 0) {
        const formattedServerPoems = serverPoems
          .filter(p => p && (p.id || p.title))
          .map((p, idx) => {
            let id = String(p.id || '').trim();
            const title = String(p.title || '').trim();

            if (!id && title) {
              id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
            if (!id) {
              id = `poem-${Date.now()}-${idx}`;
            }

            return {
              ...p,
              id: id,
              title: title,
              date: formatPoetryDate(p.date)
            };
          });

        // Google Sheet is the authoritative source of truth.
        // No defaults are appended, giving complete control over content correction.
        this.poems = formattedServerPoems;
        console.info(`[PoetryLoader] Loaded ${formattedServerPoems.length} poems strictly from Google Sheet.`);

        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('jb_poetry_cache', JSON.stringify(formattedServerPoems));
          }
        } catch (e) {}
      } else {
        console.info('[PoetryLoader] Sheet returned 0 poems, keeping existing poems.');
      }

      this.hasFetched = true;
      this._notifyListeners();
    }
  }

  App.PoetryLoader = new PoetryLoaderService();
  window.PoetryLoader = App.PoetryLoader;
})(window.App);
