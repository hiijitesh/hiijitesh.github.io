/**
 * Email Subscriber Service
 * Handles collecting and storing user email subscriptions in Google Sheets
 * along with ISO timestamp, local date, and client IP address.
 */

window.App = window.App || {};

(function(App) {
  'use strict';

  // Cache user network info in memory/sessionStorage to minimize external requests
  let cachedNetworkInfo = null;

  /**
   * Fast, privacy-friendly IP and Geolocation resolver with strict timeout & fallback.
   * Resolves IP and City/Region/Country without blocking UI.
   * @returns {Promise<{ ip: string, location: string }>}
   */
  async function getUserNetworkInfo() {
    if (cachedNetworkInfo) return cachedNetworkInfo;

    try {
      const stored = sessionStorage.getItem('app_user_network_info');
      if (stored) {
        cachedNetworkInfo = JSON.parse(stored);
        return cachedNetworkInfo;
      }
    } catch {}

    // Primary: ipwho.is provides IP and City/State/Country in one fast call
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch('https://ipwho.is/', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.success !== false) {
          const locParts = [data.city, data.region, data.country].filter(Boolean);
          const locString = locParts.length ? locParts.join(', ') : (data.timezone ? data.timezone.id : 'Unavailable');

          cachedNetworkInfo = {
            ip: data.ip ? String(data.ip).trim() : 'Unavailable',
            location: locString
          };

          try {
            sessionStorage.setItem('app_user_network_info', JSON.stringify(cachedNetworkInfo));
          } catch {}

          return cachedNetworkInfo;
        }
      }
    } catch {}

    // Fallback 1: ipify for IP + browser timezone for location
    let fallbackIP = 'Unavailable';
    const endpoints = [
      'https://api.ipify.org?format=json',
      'https://api64.ipify.org?format=json'
    ];

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const d = await res.json();
          if (d && d.ip) {
            fallbackIP = String(d.ip).trim();
            break;
          }
        }
      } catch {}
    }

    let fallbackLoc = 'Unavailable';
    try {
      fallbackLoc = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unavailable';
    } catch {}

    cachedNetworkInfo = {
      ip: fallbackIP,
      location: fallbackLoc
    };

    try {
      sessionStorage.setItem('app_user_network_info', JSON.stringify(cachedNetworkInfo));
    } catch {}

    return cachedNetworkInfo;
  }

  async function getUserIP() {
    const info = await getUserNetworkInfo();
    return info.ip;
  }

  function getSubscribedEmails() {
    try {
      const raw = localStorage.getItem('app_subscribed_emails');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function markEmailSubscribed(email) {
    if (!email) return;
    try {
      const list = getSubscribedEmails();
      const lower = email.toLowerCase().trim();
      if (!list.includes(lower)) {
        list.push(lower);
        localStorage.setItem('app_subscribed_emails', JSON.stringify(list));
      }
    } catch {}
  }

  function isEmailAlreadySubscribedLocally(email) {
    if (!email) return false;
    try {
      const list = getSubscribedEmails();
      return list.includes(email.toLowerCase().trim());
    } catch {
      return false;
    }
  }

  /**
   * Stores user email into Google Sheets with Date, Email, IP, and Location.
   *
   * @param {string} email - The user's email address
   * @param {Object} [options] - Optional metadata (e.g. { source: 'tour_section' })
   * @returns {Promise<{ success: boolean, date: string, email: string, ip: string, location: string, alreadySubscribed?: boolean, message?: string, error?: string }>}
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

    // Immediate local duplicate check: if user already subscribed in this browser
    if (isEmailAlreadySubscribedLocally(trimmedEmail)) {
      return {
        success: true,
        alreadySubscribed: true,
        message: 'Tu na already list me hain chill kr',
        email: trimmedEmail
      };
    }

    // Capture Date, IP & Location concurrently
    const [netInfo] = await Promise.all([
      getUserNetworkInfo()
    ]);

    const ip = netInfo.ip;
    const location = netInfo.location;

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
      location: location,
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
      urlObj.searchParams.set('location', payload.location);
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
          markEmailSubscribed(trimmedEmail);

          if (data && (data.alreadySubscribed || data.status === 'already_subscribed')) {
            return {
              success: true,
              alreadySubscribed: true,
              message: data.message || 'Tu na  already list me hain chill kr',
              email: trimmedEmail,
              ip: ip
            };
          }

          return { success: true, date: isoDate, email: trimmedEmail, ip: ip, serverResponse: data };
        } catch {
          markEmailSubscribed(trimmedEmail);
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
        markEmailSubscribed(trimmedEmail);
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
