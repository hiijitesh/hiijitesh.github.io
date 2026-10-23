const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Mock browser globals for Node environment
global.window = global;
global.document = {};

describe('Poetry CMS & Loader Unit Test Suite', () => {

  // Load the script in Node environment
  require('../js/utils/poetryLoader.js');
  const App = window.App;

  describe('1. formatPoetryDate Unit Tests', () => {
    const format = App.formatPoetryDate;

    it('should format Google Sheets full Date string to "Oct 2026"', () => {
      const input = "Thu Oct 01 2026 00:00:00 GMT+0530 (India Standard Time)";
      assert.equal(format(input), "Oct 2026");
    });

    it('should preserve already formatted "Oct 2026"', () => {
      assert.equal(format("Oct 2026"), "Oct 2026");
    });

    it('should format full month name "October 2026" to "Oct 2026"', () => {
      assert.equal(format("October 2026"), "Oct 2026");
      assert.equal(format("october 2026"), "Oct 2026");
      assert.equal(format("OCTOBER 2026"), "Oct 2026");
    });

    it('should format ISO date strings "2026-10-01" without timezone rollback', () => {
      assert.equal(format("2026-10-01"), "Oct 2026");
      assert.equal(format("2026-10-23"), "Oct 2026");
      assert.equal(format("2026-10"), "Oct 2026");
    });

    it('should format slash date strings "2026/10/01" to "Oct 2026"', () => {
      assert.equal(format("2026/10/01"), "Oct 2026");
    });

    it('should format "MM/YYYY" or "MM-YYYY" strings', () => {
      assert.equal(format("10-2026"), "Oct 2026");
      assert.equal(format("10/2026"), "Oct 2026");
    });

    it('should preserve older writing dates such as "Aug 2024"', () => {
      assert.equal(format("Aug 2024"), "Aug 2024");
      assert.equal(format("August 2024"), "Aug 2024");
      assert.equal(format("2024-08-15"), "Aug 2024");
    });

    it('should handle native Date objects', () => {
      const d = new Date(2026, 9, 1); // Month is 0-indexed: 9 = October
      assert.equal(format(d), "Oct 2026");
    });

    it('should fallback gracefully for empty or null dates to current month/year', () => {
      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const expected = `${months[now.getMonth()]} ${now.getFullYear()}`;

      assert.equal(format(""), expected);
      assert.equal(format(null), expected);
      assert.equal(format(undefined), expected);
    });
  });

  describe('2. PoetryLoaderService Behavior & Lifecycle', () => {
    let loader;

    beforeEach(() => {
      // Setup fresh default writings
      App.defaultWritings = [
        { id: 'def-1', title: 'Default One', date: 'Aug 2024', views: 100 },
        { id: 'def-2', title: 'Default Two', date: 'Sep 2024', views: 200 }
      ];

      // Re-instantiate service
      loader = new App.PoetryLoader.constructor();
    });

    it('should initialize with default writings immediately', () => {
      loader.init();
      const poems = loader.getPoems();
      assert.equal(poems.length, 2);
      assert.equal(poems[0].id, 'def-1');
      assert.equal(poems[0].date, 'Aug 2024');
    });

    it('should format default writings dates on init', () => {
      App.defaultWritings = [
        { id: 'raw-date-1', title: 'Raw Date Poem', date: '2026-10-01' }
      ];
      loader.init();
      assert.equal(loader.getPoems()[0].date, 'Oct 2026');
    });

    it('should merge server poems properly and format their dates', () => {
      loader.init();
      const rawServerPoems = [
        {
          id: 'mer-andar-ki-awaaz',
          title: 'Mere Andar Ki Awaaz',
          date: 'Thu Oct 01 2026 00:00:00 GMT+0530 (India Standard Time)',
          content: 'Some poetry text'
        }
      ];

      loader._mergeAndUpdate(rawServerPoems);
      const result = loader.getPoems();

      // Server poem should be first, followed by default poems
      assert.equal(result.length, 3);
      assert.equal(result[0].id, 'mer-andar-ki-awaaz');
      assert.equal(result[0].date, 'Oct 2026');
      assert.equal(result[1].id, 'def-1');
      assert.equal(result[2].id, 'def-2');
    });

    it('should auto-generate slug ID if server poem omitted ID', () => {
      loader.init();
      const rawServerPoems = [
        {
          title: 'Nayi Subah Ki Roshni',
          date: '2026-10-15',
          content: 'Test content'
        }
      ];

      loader._mergeAndUpdate(rawServerPoems);
      const result = loader.getPoems();
      assert.equal(result[0].id, 'nayi-subah-ki-roshni');
      assert.equal(result[0].date, 'Oct 2026');
    });

    it('should override default poem if server provides poem with same ID', () => {
      loader.init();
      const rawServerPoems = [
        {
          id: 'def-1',
          title: 'Updated Default One',
          date: '2026-10-01',
          content: 'Updated content from Google Sheet'
        }
      ];

      loader._mergeAndUpdate(rawServerPoems);
      const result = loader.getPoems();
      assert.equal(result.length, 2);
      assert.equal(result[0].title, 'Updated Default One');
      assert.equal(result[0].date, 'Oct 2026');
    });

    it('should notify registered listeners when poems are fetched', () => {
      loader.init();
      let notified = false;
      loader.addListener((poems) => {
        notified = true;
        assert.equal(poems[0].id, 'new-poem');
      });

      loader._mergeAndUpdate([{ id: 'new-poem', title: 'New Poem', date: '2026-10-01' }]);
      assert.equal(notified, true);
    });

    it('should immediately invoke listener if added after fetch has already completed', () => {
      loader.init();
      loader._mergeAndUpdate([{ id: 'new-poem', title: 'New Poem', date: '2026-10-01' }]);

      let lateNotified = false;
      loader.addListener((poems) => {
        lateNotified = true;
        assert.equal(poems[0].id, 'new-poem');
      });

      assert.equal(lateNotified, true);
    });

    it('should not overwrite fetched poems if init() is called again later', () => {
      loader.init();
      loader._mergeAndUpdate([{ id: 'server-p', title: 'Server Poem', date: '2026-10-01' }]);
      assert.equal(loader.getPoems()[0].id, 'server-p');

      // Call init() again
      loader.init();
      assert.equal(loader.getPoems()[0].id, 'server-p');
    });

    it('should reset isFetching even if an error is thrown', async () => {
      loader.apiEndpoint = 'https://invalid-non-existent-domain.fake/exec';
      window.location = { protocol: 'https:' };
      
      try {
        await loader.fetchFromSheet();
      } catch {}

      assert.equal(loader.isFetching, false);
    });
  });

  describe('3. Live Google Apps Script API Integration Test', () => {
    it('should fetch real poetry from live Google Sheet and receive "Mere Andar Ki Awaaz" formatted as "Oct 2026"', async () => {
      const loader = new App.PoetryLoader.constructor();
      loader.apiEndpoint = 'https://script.google.com/macros/s/AKfycbx4yq-WGnp4bl7tPjaoge6mj-oluJupxcHjZcCKgcX2T_JFpRT5xv8h124azfJ0U7iL/exec';
      window.location = { protocol: 'https:', href: 'https://hiijitesh.github.io' };

      loader.init();
      const poems = await loader.fetchFromSheet();

      assert.ok(Array.isArray(poems), 'Poems must be an array');
      assert.ok(poems.length > 0, 'Must have at least one poem');

      const sheetPoem = poems.find(p => p.id === 'mer-andar-ki-awaaz');
      assert.ok(sheetPoem, 'Must contain "mer-andar-ki-awaaz" from Google Sheet');
      assert.equal(sheetPoem.title, 'Mere Andar Ki Awaaz');
      assert.equal(sheetPoem.date, 'Oct 2026');
      console.log('   ✓ Live test passed! Found poem:', sheetPoem.title, 'with date:', sheetPoem.date);
    });
  });
});
