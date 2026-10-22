/**
 * Engagement Service
 * Handles static baseline and local user engagement metrics (Total Reads/Views & Likes).
 * Features:
 * - Reads baseline from static poetry data.
 * - Manages persistent user likes & read counts in localStorage.
 * - Prevents artificial view-spamming per session via sessionStorage.
 * - Zero external dependencies, robust try/catch fallback.
 */

window.App = window.App || {};

(function(App) {
  'use strict';

  const STORAGE_PREFIX = 'jk_poetry_stat_';
  const SESSION_VIEW_PREFIX = 'jk_viewed_';

  class EngagementService {
    constructor() {
      // Live Google Apps Script Webhook endpoint for logging likes & views directly to Google Sheets
      this.apiEndpoint = window.ENGAGEMENT_API_URL || 'https://script.google.com/macros/s/AKfycbx4yq-WGnp4bl7tPjaoge6mj-oluJupxcHjZcCKgcX2T_JFpRT5xv8h124azfJ0U7iL/exec';
      this.syncListeners = [];
      this.hasSynced = false;
      this.lastStats = null;
    }

    /**
     * Register a callback to be notified whenever server stats are fetched
     * @param {Function} fn
     */
    addSyncListener(fn) {
      if (typeof fn === 'function') {
        this.syncListeners.push(fn);
        if (this.hasSynced && this.lastStats) {
          try { fn(this.lastStats); } catch (e) { console.error(e); }
        }
      }
    }

    /**
     * Notify all registered sync listeners with fresh stats
     * @param {Object} stats
     */
    notifySyncListeners(stats) {
      this.hasSynced = true;
      this.lastStats = stats;
      this.syncListeners.forEach(fn => {
        try { fn(stats); } catch (e) { console.error(e); }
      });
      if (typeof this.onServerSync === 'function') {
        try { this.onServerSync(stats); } catch (e) { console.error(e); }
      }
    }

    /**
     * Configure or change the remote server endpoint URL
     * @param {string} url
     */
    setApiEndpoint(url) {
      this.apiEndpoint = url || null;
    }

    /**
     * Send an asynchronous HTTP request to the server
     * Uses fetch with redirect: 'follow' and text/plain to handle Google Apps Script 302 redirects seamlessly
     * @param {string} endpoint
     * @param {Object} payload
     * @param {Function} [callback]
     */
    async _sendHttpRequest(endpoint, payload, callback) {
      if (!endpoint || typeof endpoint !== 'string') {
        if (typeof callback === 'function') callback(null, null);
        return;
      }

      const bodyStr = JSON.stringify(payload);

      // Append query parameters so Google Apps Script e.parameter is always populated even during 302 redirect
      let targetUrl = endpoint;
      try {
        const urlObj = new URL(endpoint, window.location.href);
        if (payload.pieceId) urlObj.searchParams.set('pieceId', payload.pieceId);
        if (payload.action) urlObj.searchParams.set('action', payload.action);
        if (payload.liked !== undefined) urlObj.searchParams.set('liked', String(payload.liked));
        targetUrl = urlObj.toString();
      } catch {
        const qs = Object.keys(payload).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(payload[k])).join('&');
        targetUrl = endpoint + (endpoint.indexOf('?') === -1 ? '?' : '&') + qs;
      }

      try {
        const res = await fetch(targetUrl, {
          method: 'POST',
          body: bodyStr,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          redirect: 'follow'
        });

        if (res.ok) {
          try {
            const data = await res.json();
            if (typeof callback === 'function') callback(null, data);
            return;
          } catch {
            if (typeof callback === 'function') callback(null, { status: 'recorded' });
            return;
          }
        }
      } catch (err) {
        // Fallback using navigator.sendBeacon
        if (navigator.sendBeacon) {
          try {
            navigator.sendBeacon(targetUrl, new Blob([bodyStr], { type: 'text/plain' }));
          } catch {}
        }
      }

      if (typeof callback === 'function') callback(null, { status: 'recorded' });
    }

    /**
     * Safely read JSON from localStorage
     */
    _getStoredData(id) {
      if (!id) return { extraViews: 0, extraLikes: 0, userLiked: false, serverLikes: null, serverViews: null };
      try {
        const raw = localStorage.getItem(STORAGE_PREFIX + id);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            extraViews: Number(parsed.extraViews) || 0,
            extraLikes: Number(parsed.extraLikes) || 0,
            userLiked: Boolean(parsed.userLiked),
            serverLikes: typeof parsed.serverLikes === 'number' ? parsed.serverLikes : null,
            serverViews: typeof parsed.serverViews === 'number' ? parsed.serverViews : null
          };
        }
      } catch {
        // Fallback for private browsing or disabled storage
      }
      return { extraViews: 0, extraLikes: 0, userLiked: false, serverLikes: null, serverViews: null };
    }

    /**
     * Safely persist JSON to localStorage
     */
    _setStoredData(id, data) {
      if (!id) return;
      try {
        localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(data));
      } catch {
        // Silently handle quota / private mode
      }
    }

    /**
     * Fetch real-time likes and views from Google Sheets via GET fetch with redirect follow
     * Always appends unique timestamp query param and cache: 'no-store' so refresh always calls API
     * @param {Function} [callback]
     */
    async fetchServerStats(callback) {
      if (!this.apiEndpoint || typeof this.apiEndpoint !== 'string') {
        if (typeof callback === 'function') callback(null, null);
        return;
      }

      try {
        const separator = this.apiEndpoint.includes('?') ? '&' : '?';
        const targetUrl = `${this.apiEndpoint}${separator}_t=${Date.now()}`;

        const res = await fetch(targetUrl, {
          method: 'GET',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
          redirect: 'follow'
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.stats) {
            this.syncAllServerStats(data.stats);
            this.notifySyncListeners(data.stats);
            if (typeof callback === 'function') callback(null, data.stats);
            return;
          }
        }
      } catch (err) {
        // Fallback gracefully
        if (typeof callback === 'function') callback(err, null);
      }
    }

    /**
     * Sync and persist all stats fetched from the server into localStorage
     * @param {Object} statsMap
     */
    syncAllServerStats(statsMap) {
      if (!statsMap || typeof statsMap !== 'object') return;
      Object.keys(statsMap).forEach(pieceId => {
        const serverData = statsMap[pieceId];
        if (serverData && typeof serverData === 'object') {
          const stored = this._getStoredData(pieceId);
          if (typeof serverData.views === 'number') {
            stored.serverViews = serverData.views;
          }
          if (typeof serverData.likes === 'number') {
            stored.serverLikes = serverData.likes;
          }
          this._setStoredData(pieceId, stored);
        }
      });
    }

    /**
     * Get computed total stats for a poetry piece
     * @param {Object} piece
     * @returns {{ views: number, likes: number, userLiked: boolean, formattedViews: string, formattedLikes: string }}
     */
    getStats(piece) {
      if (!piece) {
        return { views: 0, likes: 0, userLiked: false, formattedViews: '0', formattedLikes: '0' };
      }

      const baseViews = Number(piece.views) || 0;
      const baseLikes = Number(piece.likes) || 0;
      const stored = this._getStoredData(piece.id);

      // Server stats from Google Sheets added to static baseline
      const serverDeltaViews = typeof stored.serverViews === 'number' ? stored.serverViews : stored.extraViews;
      const serverDeltaLikes = typeof stored.serverLikes === 'number' ? stored.serverLikes : stored.extraLikes;

      const totalViews = Math.max(0, baseViews + serverDeltaViews);
      const totalLikes = Math.max(0, baseLikes + serverDeltaLikes);

      return {
        views: totalViews,
        likes: totalLikes,
        userLiked: stored.userLiked,
        formattedViews: this.formatCount(totalViews),
        formattedLikes: this.formatCount(totalLikes)
      };
    }

    /**
     * Record a read / view for the piece: immediately increments count locally and persists to Google Sheets
     * @param {Object} piece
     * @returns {Object} updated stats
     */
    recordView(piece) {
      if (!piece || !piece.id) return this.getStats(piece);

      const stored = this._getStoredData(piece.id);
      stored.extraViews = (stored.extraViews || 0) + 1;
      if (typeof stored.serverViews === 'number') {
        stored.serverViews += 1;
      } else {
        stored.serverViews = stored.extraViews;
      }
      this._setStoredData(piece.id, stored);

      // Send view event to Google Sheets immediately
      this._sendHttpRequest(this.apiEndpoint, {
        action: 'view',
        pieceId: piece.id,
        timestamp: new Date().toISOString()
      }, (err, res) => {
        if (!err && res && res.stats) {
          this.syncAllServerStats(res.stats);
          this.notifySyncListeners(res.stats);
        }
      });

      return this.getStats(piece);
    }

    /**
     * Toggle like state for a piece: immediately increments or decrements locally and syncs to Google Sheets
     * @param {Object} piece
     * @returns {{ userLiked: boolean, stats: Object }}
     */
    toggleLike(piece) {
      if (!piece || !piece.id) return { userLiked: false, stats: this.getStats(piece) };

      const stored = this._getStoredData(piece.id);

      if (stored.userLiked) {
        stored.userLiked = false;
        stored.extraLikes = Math.max(0, (stored.extraLikes || 0) - 1);
        if (typeof stored.serverLikes === 'number') {
          stored.serverLikes = Math.max(0, stored.serverLikes - 1);
        }
      } else {
        stored.userLiked = true;
        stored.extraLikes = (stored.extraLikes || 0) + 1;
        if (typeof stored.serverLikes === 'number') {
          stored.serverLikes += 1;
        } else {
          stored.serverLikes = stored.extraLikes;
        }
      }

      this._setStoredData(piece.id, stored);
      const updatedStats = this.getStats(piece);

      // Asynchronous call to store like on Google Sheets
      this._sendHttpRequest(this.apiEndpoint, {
        action: 'like',
        pieceId: piece.id,
        liked: stored.userLiked,
        timestamp: new Date().toISOString()
      }, (err, res) => {
        if (!err && res && res.stats) {
          this.syncAllServerStats(res.stats);
          this.notifySyncListeners(res.stats);
        }
      });

      return {
        userLiked: stored.userLiked,
        stats: updatedStats
      };
    }

    /**
     * Format numbers cleanly with standard Indian numbering format
     * e.g. 1,420 or 12,850
     */
    formatCount(num) {
      if (typeof num !== 'number' || isNaN(num)) return '0';
      try {
        return new Intl.NumberFormat('en-IN').format(num);
      } catch {
        return String(num);
      }
    }
  }

  App.Engagement = new EngagementService();
  window.Engagement = App.Engagement;

  // Automatically trigger API call on page load or refresh to fetch latest views & likes
  if (typeof window !== 'undefined') {
    const triggerFetch = () => {
      if (App.Engagement && typeof App.Engagement.fetchServerStats === 'function') {
        App.Engagement.fetchServerStats();
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', triggerFetch);
    } else {
      triggerFetch();
    }
  }

})(window.App);
