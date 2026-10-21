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
    /**
     * Safely read JSON from localStorage
     */
    _getStoredData(id) {
      if (!id) return { extraViews: 0, extraLikes: 0, userLiked: false };
      try {
        const raw = localStorage.getItem(STORAGE_PREFIX + id);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            extraViews: Number(parsed.extraViews) || 0,
            extraLikes: Number(parsed.extraLikes) || 0,
            userLiked: Boolean(parsed.userLiked)
          };
        }
      } catch {
        // Fallback for private browsing or disabled storage
      }
      return { extraViews: 0, extraLikes: 0, userLiked: false };
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

      const totalViews = Math.max(0, baseViews + stored.extraViews);
      const totalLikes = Math.max(0, baseLikes + stored.extraLikes);

      return {
        views: totalViews,
        likes: totalLikes,
        userLiked: stored.userLiked,
        formattedViews: this.formatCount(totalViews),
        formattedLikes: this.formatCount(totalLikes)
      };
    }

    /**
     * Record a read / view for the piece (session-throttled to keep counts genuine)
     * @param {Object} piece
     * @returns {Object} updated stats
     */
    recordView(piece) {
      if (!piece || !piece.id) return this.getStats(piece);

      try {
        const sessionKey = SESSION_VIEW_PREFIX + piece.id;
        const alreadyViewed = sessionStorage.getItem(sessionKey);

        if (!alreadyViewed) {
          sessionStorage.setItem(sessionKey, '1');
          const stored = this._getStoredData(piece.id);
          stored.extraViews += 1;
          this._setStoredData(piece.id, stored);
        }
      } catch {
        // Session storage failure fallback
      }

      return this.getStats(piece);
    }

    /**
     * Toggle like state for a piece
     * @param {Object} piece
     * @returns {{ userLiked: boolean, stats: Object }}
     */
    toggleLike(piece) {
      if (!piece || !piece.id) return { userLiked: false, stats: this.getStats(piece) };

      const stored = this._getStoredData(piece.id);

      if (stored.userLiked) {
        stored.userLiked = false;
        stored.extraLikes = Math.max(0, stored.extraLikes - 1);
      } else {
        stored.userLiked = true;
        stored.extraLikes += 1;
      }

      this._setStoredData(piece.id, stored);
      const updatedStats = this.getStats(piece);

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

})(window.App);
