/**
 * Poetry Loader Service
 * Fetches poetry from Google Sheets (Poetry tab) via the Apps Script API.
 * Falls back gracefully to defaultWritings.js when offline or on file:// protocol.
 *
 * Automatically formats sheet date entries into "Oct 2026" (Mon YYYY) format.
 */
window.App = window.App || {};

(function(App) {
  'use strict';

  /**
   * Helper to format any date input (Date object, timestamp string, ISO string)
   * into clean "Oct 2026" (Mon YYYY) format.
   */
  function formatPoetryDate(rawDate) {
    if (!rawDate) return 'Oct 2026';

    // If already in "MMM YYYY" or "MMMM YYYY" format e.g. "Oct 2026"
    if (typeof rawDate === 'string') {
      const trimmed = rawDate.trim();
      const m = trimmed.match(/^([a-zA-Z]{3,9})\s+(\d{4})$/);
      if (m) {
        const monthShort = m[1].slice(0, 3);
        return monthShort.charAt(0).toUpperCase() + monthShort.slice(1).toLowerCase() + ' ' + m[2];
      }
    }

    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    return String(rawDate);
  }

  // Export helper globally so PoetryCard can also use it
  App.formatPoetryDate = formatPoetryDate;

  class PoetryLoaderService {
    constructor() {
      this.apiEndpoint = null;
      this.poems = [];
      this.hasFetched = false;
      this.isFetching = false;
      this.listeners = [];
      this.fetchError = null;
    }

    /**
     * Initialize with the configured API endpoint
     */
    init() {
      this.apiEndpoint = window.ENGAGEMENT_API_URL || null;

      // Start with default writings as immediate baseline
      if (App.defaultWritings && Array.isArray(App.defaultWritings)) {
        this.poems = App.defaultWritings.map(p => ({
          ...p,
          date: formatPoetryDate(p.date)
        }));
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
        const urlObj = new URL(endpoint, window.location.href);
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
     * Uses direct GET with follow redirects (simple CORS request, no preflight OPTIONS needed)
     */
    async fetchFromSheet() {
      if (!this.apiEndpoint || this.isFetching) return this.poems;

      // Don't attempt fetch on file:// protocol
      if (window.location.protocol === 'file:') {
        console.info('[PoetryLoader] Running on file:// protocol, using defaults only.');
        return this.poems;
      }

      this.isFetching = true;
      this.fetchError = null;

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
        console.warn('[PoetryLoader] Fallback also failed, using defaults:', err.message || err);
      }

      this.isFetching = false;
      return this.poems;
    }

    /**
     * Merge server poems with defaults and notify listeners
     * Formats all dates to "Oct 2026" (Mon YYYY)
     * Server poems override defaults by matching ID
     * @param {Array} serverPoems
     */
    _mergeAndUpdate(serverPoems) {
      if (serverPoems.length > 0) {
        const formattedServerPoems = serverPoems.map(p => ({
          ...p,
          date: formatPoetryDate(p.date)
        }));

        const serverMap = new Map();
        formattedServerPoems.forEach(p => {
          if (p.id) serverMap.set(p.id, p);
        });

        // Server poems first, then any defaults not on the server
        const defaults = (App.defaultWritings || []).map(p => ({
          ...p,
          date: formatPoetryDate(p.date)
        }));
        const merged = [...formattedServerPoems];

        defaults.forEach(defPoem => {
          if (defPoem.id && !serverMap.has(defPoem.id)) {
            merged.push(defPoem);
          }
        });

        this.poems = merged;
        console.info(`[PoetryLoader] Loaded ${formattedServerPoems.length} poems from sheet, ${merged.length} total after merge.`);
      } else {
        console.info('[PoetryLoader] Sheet returned 0 poems, keeping defaults.');
      }

      this.hasFetched = true;
      this.isFetching = false;
      this._notifyListeners();
    }
  }

  App.PoetryLoader = new PoetryLoaderService();
  window.PoetryLoader = App.PoetryLoader;
})(window.App);
