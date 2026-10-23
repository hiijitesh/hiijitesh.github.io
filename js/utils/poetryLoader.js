/**
 * Poetry Loader Service
 * Fetches poetry from Google Sheets (Poetry tab) via the Apps Script API.
 * Falls back gracefully to defaultWritings.js when offline or on file:// protocol.
 *
 * Architecture:
 * 1. Immediately returns defaultWritings so the page is never empty.
 * 2. Fires an async fetch to Google Sheets for live poetry data.
 * 3. Merges server poems with local defaults (server takes priority by ID).
 * 4. Notifies listeners so PoetrySection can re-render seamlessly.
 */
window.App = window.App || {};

(function(App) {
  'use strict';

  class PoetryLoaderService {
    constructor() {
      this.apiEndpoint = null; // set after DOM
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
        this.poems = [...App.defaultWritings];
      }
    }

    /**
     * Register a callback to be called whenever poems are updated
     * @param {Function} fn - Receives the poems array
     */
    addListener(fn) {
      if (typeof fn === 'function') {
        this.listeners.push(fn);
        // If we already fetched, immediately call with current poems
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
     * Fetch poems from Google Sheets via Apps Script
     * Merges with defaults (server poems override by matching ID)
     */
    async fetchFromSheet() {
      if (!this.apiEndpoint || this.isFetching) return this.poems;

      this.isFetching = true;
      this.fetchError = null;

      try {
        const separator = this.apiEndpoint.includes('?') ? '&' : '?';
        const url = `${this.apiEndpoint}${separator}action=get_poetry&_t=${Date.now()}`;

        const res = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
          redirect: 'follow'
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        if (data && data.status === 'success' && Array.isArray(data.poetry)) {
          const serverPoems = data.poetry;

          if (serverPoems.length > 0) {
            // Build a map of server poem IDs for fast lookup
            const serverMap = new Map();
            serverPoems.forEach(p => {
              if (p.id) serverMap.set(p.id, p);
            });

            // Merge: server poems take priority, then append any defaults not in server
            const defaults = App.defaultWritings || [];
            const merged = [...serverPoems];

            defaults.forEach(defPoem => {
              if (defPoem.id && !serverMap.has(defPoem.id)) {
                merged.push(defPoem);
              }
            });

            this.poems = merged;
          }
          // If server returned 0 poems, keep defaults (sheet may be empty / just created)

          this.hasFetched = true;
          this._notifyListeners();
        }
      } catch (err) {
        this.fetchError = err;
        console.warn('[PoetryLoader] Could not fetch from sheet, using defaults:', err.message || err);
        // Keep defaults, no re-notify needed
      } finally {
        this.isFetching = false;
      }

      return this.poems;
    }
  }

  App.PoetryLoader = new PoetryLoaderService();
  window.PoetryLoader = App.PoetryLoader;
})(window.App);
