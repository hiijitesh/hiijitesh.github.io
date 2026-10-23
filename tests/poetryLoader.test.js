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
      // Clear localStorage mock if present
      if (global.localStorage && typeof global.localStorage.clear === 'function') {
        global.localStorage.clear();
      }
      delete global.localStorage;

      // Re-instantiate service
      loader = new App.PoetryLoader.constructor();
    });

    it('should initialize with empty poems array when no cache exists', () => {
      loader.init();
      const poems = loader.getPoems();
      assert.deepEqual(poems, []);
    });

    it('should restore cached poems from localStorage on init and format dates', () => {
      const cached = [
        { id: 'cached-1', title: 'Cached Poem', date: '2026-10-01' }
      ];
      global.localStorage = {
        getItem: (k) => k === 'jb_poetry_cache' ? JSON.stringify(cached) : null,
        setItem: () => {}
      };

      loader.init();
      const poems = loader.getPoems();
      assert.equal(poems.length, 1);
      assert.equal(poems[0].id, 'cached-1');
      assert.equal(poems[0].date, 'Oct 2026');
    });

    it('should set server poems as authoritative and format their dates', () => {
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

      // Server poems are authoritative — single source of truth
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'mer-andar-ki-awaaz');
      assert.equal(result[0].date, 'Oct 2026');
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

    it('should set server poems as source of truth and update cache', () => {
      let savedKey = null;
      let savedVal = null;
      global.localStorage = {
        getItem: () => null,
        setItem: (k, v) => { savedKey = k; savedVal = v; }
      };

      loader.init();
      const rawServerPoems = [
        {
          id: 'sheet-poem-1',
          title: 'Updated Content From Sheet',
          date: '2026-10-01',
          content: 'Updated content from Google Sheet'
        }
      ];

      loader._mergeAndUpdate(rawServerPoems);
      const result = loader.getPoems();
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'sheet-poem-1');
      assert.equal(result[0].title, 'Updated Content From Sheet');
      assert.equal(result[0].date, 'Oct 2026');
      assert.equal(savedKey, 'jb_poetry_cache');
      assert.ok(savedVal.includes('sheet-poem-1'));
    });

    it('should auto-detect and unshift poems if server sent shifted column schema', () => {
      loader.init();
      const rawShifted = [
        {
          id: "Ek samay tha jahan,\nSab kuch naa paane ka bhay tha\n\nEk aaj waqt hain...",
          category: "एक समय था जहाँ,\nसब कुछ ना पाने का भय था...",
          title: "mere-soch-pare-bhi",
          title_hi: "Poetry",
          date: "Mere Soch Pare Bhi, Kuch Hona Hain",
          excerpt: "मेरे सोच परे भी, कुछ होना हैं",
          content: "Thu Aug 01 2024 00:00:00 GMT+0530 (India Standard Time)",
          content_hi: "Ek samay tha jahan sab kuch naa paane ka bhay tha...",
          views: 120,
          likes: 45
        }
      ];

      loader._mergeAndUpdate(rawShifted);
      const result = loader.getPoems();

      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'mere-soch-pare-bhi');
      assert.equal(result[0].category, 'Poetry');
      assert.equal(result[0].title, 'Mere Soch Pare Bhi, Kuch Hona Hain');
      assert.equal(result[0].title_hi, 'मेरे सोच परे भी, कुछ होना हैं');
      assert.equal(result[0].date, 'Aug 2024');
      assert.equal(result[0].excerpt, 'Ek samay tha jahan sab kuch naa paane ka bhay tha...');
      assert.ok(result[0].content.startsWith('Ek samay tha jahan'));
      assert.ok(result[0].content_hi.startsWith('एक समय था जहाँ'));
      assert.equal(result[0].views, 120);
      assert.equal(result[0].likes, 45);
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
    it('should connect to live Google Apps Script endpoint and handle poetry response', async () => {
      const loader = new App.PoetryLoader.constructor();
      loader.apiEndpoint = 'https://script.google.com/macros/s/AKfycbx4yq-WGnp4bl7tPjaoge6mj-oluJupxcHjZcCKgcX2T_JFpRT5xv8h124azfJ0U7iL/exec';
      window.location = { protocol: 'https:', href: 'https://hiijitesh.github.io' };

      loader.init();
      const poems = await loader.fetchFromSheet();

      assert.ok(Array.isArray(poems), 'Poems must be an array');
      console.log(`   ✓ Live API responded successfully with ${poems.length} poem(s) from Google Sheet.`);

      if (poems.length > 0) {
        assert.ok(poems[0].id, 'Poem must have an ID');
        assert.ok(poems[0].title, 'Poem must have a title');
        assert.ok(poems[0].date, 'Poem must have a date');
      }
    });
  });
});
