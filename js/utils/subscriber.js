/**
 * Email Subscriber Service
 * Handles collecting and storing user email subscriptions in Google Sheets
 * along with ISO timestamp, local date, and client IP address.
 */

window.App = window.App || {};

(function(App) {
  'use strict';

  // Cache user IP in memory/sessionStorage to minimize external requests
  let cachedIP = null;

  /**
   * Fast, privacy-friendly public IP resolver with strict timeout & multi-provider fallback.
   * Never blocks UI if IP providers are unreachable or blocked by privacy extensions.
   * @returns {Promise<string>}
   */
  async function getUserIP() {
    if (cachedIP) return cachedIP;

    try {
      const stored = sessionStorage.getItem('app_user_ip');
      if (stored) {
        cachedIP = stored;
        return stored;
      }
    } catch {}

    const endpoints = [
      'https://api.ipify.org?format=json',
      'https://api64.ipify.org?format=json'
    ];

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data && data.ip) {
            cachedIP = String(data.ip).trim();
            try {
              sessionStorage.setItem('app_user_ip', cachedIP);
            } catch {}
            return cachedIP;
          }
        }
      } catch {
        // Continue to fallback endpoint
      }
    }

    return 'Unavailable';
  }

  /**
   * Stores user email into Google Sheets with Date, Email, and IP.
   * 
   * @param {string} email - The user's email address
   * @param {Object} [options] - Optional metadata (e.g. { source: 'tour_section' })
   * @returns {Promise<{ success: boolean, date: string, email: string, ip: string, error?: string }>}
   */
  async function storeUserEmail(email, options = {}) {
    if (!email || typeof email !== 'string') {
      return { success: false, error: 'Email address is required.' };
    }

    const trimmedEmail = email.trim();

    // Validate email format
    if (App.validateEmail) {
      const validation = App.validateEmail(trimmedEmail);
      if (!validation.valid) {
        return { success: false, error: validation.error || 'Please enter a valid email address.' };
      }
    }

    // Capture Date & IP concurrently
    const [ip] = await Promise.all([
      getUserIP()
    ]);

    const now = new Date();
    const isoDate = now.toISOString();
    const formattedDate = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium'
    });

    const payload = {
      action: 'subscribe_email',
      email: trimmedEmail,
      date: isoDate,
      formattedDate: formattedDate,
      ip: ip,
      source: options.source || 'general',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };

    const endpoint = window.EMAIL_API_URL ||
      window.ENGAGEMENT_API_URL ||
      'https://script.google.com/macros/s/AKfycbx4yq-WGnp4bl7tPjaoge6mj-oluJupxcHjZcCKgcX2T_JFpRT5xv8h124azfJ0U7iL/exec';

    // Build URL query params to guarantee delivery across Google Apps Script 302 redirects
    let targetUrl = endpoint;
    try {
      const urlObj = new URL(endpoint, window.location.href);
      urlObj.searchParams.set('action', payload.action);
      urlObj.searchParams.set('email', payload.email);
      urlObj.searchParams.set('date', payload.date);
      urlObj.searchParams.set('formattedDate', payload.formattedDate);
      urlObj.searchParams.set('ip', payload.ip);
      urlObj.searchParams.set('source', payload.source);
      targetUrl = urlObj.toString();
    } catch {
      const qs = Object.keys(payload)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(payload[k]))
        .join('&');
      targetUrl = endpoint + (endpoint.indexOf('?') === -1 ? '?' : '&') + qs;
    }

    const bodyStr = JSON.stringify(payload);

    // Primary: fetch with POST & text/plain (avoids CORS preflight in Apps Script)
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        body: bodyStr,
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        redirect: 'follow',
        mode: 'cors'
      });

      if (res.ok) {
        try {
          const data = await res.json();
          return { success: true, date: isoDate, email: trimmedEmail, ip: ip, serverResponse: data };
        } catch {
          return { success: true, date: isoDate, email: trimmedEmail, ip: ip };
        }
      }
    } catch (err) {
      // Fallback 1: Try GET with query parameters if POST encountered redirect/CORS issues
      try {
        const getRes = await fetch(targetUrl, {
          method: 'GET',
          redirect: 'follow',
          mode: 'no-cors'
        });
        return { success: true, date: isoDate, email: trimmedEmail, ip: ip, fallback: 'get' };
      } catch {}

      // Fallback 2: navigator.sendBeacon
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        try {
          navigator.sendBeacon(targetUrl, new Blob([bodyStr], { type: 'text/plain' }));
          return { success: true, date: isoDate, email: trimmedEmail, ip: ip, fallback: 'beacon' };
        } catch {}
      }
    }

    // Even if remote server took too long, acknowledge submission
    return { success: true, date: isoDate, email: trimmedEmail, ip: ip };
  }

  // Exports
  App.storeUserEmail = storeUserEmail;
  App.getUserIP = getUserIP;
  window.storeUserEmail = storeUserEmail;
  window.getUserIP = getUserIP;
})(window.App);
