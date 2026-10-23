/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: Engagement Stats, Email Subscribers & Poetry CMS
 * ==============================================================================
 *
 * HOW TO INSTALL / UPDATE IN GOOGLE SHEETS:
 * 1. Open your Google Sheet (where your views, likes, and poetry are recorded).
 * 2. In the top menu, go to: Extensions > Apps Script.
 * 3. Replace ALL code in "Code.gs" with this complete script.
 * 4. Click the blue "Deploy" button (top right) > "Manage deployments".
 * 5. Click the pencil icon (Edit), choose Version: "New version".
 * 6. Make sure:
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 7. Click "Deploy".
 *
 * SHEETS STRUCTURE:
 * ─────────────────
 * Tab: "Stats"        → Auto-managed. Columns: pieceId | Views | Likes
 * Tab: "Subscribers"  → Auto-managed. Columns: Date | Email | IP | Location | Local Time | Source
 * Tab: "Poetry"       → YOU WRITE HERE. Columns:
 *    A: content        (full poem body — Hinglish. Use Alt+Enter for newlines inside a cell)
 *    B: content_hi     (full poem body — Hindi Devanagari)
 *    C: id             (unique slug, e.g. "mere-soch-pare-bhi")
 *    D: category       (Poetry / Nazm / Shayari)
 *    E: title          (Hinglish title)
 *    F: title_hi       (Hindi title in Devanagari)
 *    G: date           (display date, e.g. "Oct 2026")
 *    H: excerpt        (1–2 line preview in Hinglish)
 *    I: status         (Published / Draft — only "Published" poems are shown on the website)
 *    J: views          (views count)
 *    K: likes          (likes count)
 *
 * ==============================================================================
 */

const SUBSCRIBERS_SHEET_NAME = "Subscribers";
const STATS_SHEET_NAME = "Stats";
const POETRY_SHEET_NAME = "Poetry";

function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  // Wait up to 10 seconds for concurrent requests
  lock.tryLock(10000);

  try {
    let params = {};

    // 1. Parse URL query parameters
    if (e && e.parameter) {
      params = Object.assign({}, e.parameter);
    }

    // 2. Parse JSON postData if sent via POST
    if (e && e.postData && e.postData.contents) {
      try {
        const postJson = JSON.parse(e.postData.contents);
        params = Object.assign(params, postJson);
      } catch (jsonErr) {
        // Body was not JSON; fallback to urlencoded or raw params
      }
    }

    const action = (params.action || '').trim().toLowerCase();

    // --------------------------------------------------------------------------
    // ACTION: SEED DEFAULT POEMS (Deprecated: poems managed manually in sheet)
    // --------------------------------------------------------------------------
    if (action === 'seed_defaults' || action === 'seed_poetry') {
      return createJsonResponse({
        status: 'success',
        message: 'Default poems removed. All poetry is managed directly in your Google Sheet.'
      });
    }

    // --------------------------------------------------------------------------
    // ACTION: GET POETRY (Fetch all published poems from "Poetry" sheet)
    // --------------------------------------------------------------------------
    if (action === 'get_poetry') {
      return handleGetPoetry();
    }

    // --------------------------------------------------------------------------
    // ACTION: SUBSCRIBE EMAIL
    // --------------------------------------------------------------------------
    if (action === 'subscribe_email' || action === 'subscribe' || params.email) {
      const email = (params.email || '').trim();
      const ip = (params.ip || 'Unavailable').trim();
      const location = (params.location || 'Unavailable').trim();
      const date = (params.date || new Date().toISOString()).trim();
      const formattedDate = (params.formattedDate || new Date().toLocaleString()).trim();
      const source = (params.source || 'website').trim();

      if (!email) {
        return createJsonResponse({ status: 'error', message: 'Email is required' });
      }

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let subSheet = ss.getSheetByName(SUBSCRIBERS_SHEET_NAME);
      const headers = ["Date", "Email", "IP", "Location", "Local Time", "Source"];

      // Create "Subscribers" sheet if it does not exist
      if (!subSheet) {
        subSheet = ss.insertSheet(SUBSCRIBERS_SHEET_NAME);
        subSheet.appendRow(headers);

        // Style header row
        const headerRange = subSheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#111827");
        headerRange.setFontColor("#f9fafb");
        subSheet.setFrozenRows(1);
        subSheet.autoResizeColumns(1, headers.length);
      } else {
        // If sheet exists but header is missing Location, update headers
        const headerRow = subSheet.getRange(1, 1, 1, Math.max(1, subSheet.getLastColumn())).getValues()[0];
        const hasLocation = headerRow.some(function(h) { return String(h).toLowerCase() === 'location'; });
        if (!hasLocation) {
          subSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        }
      }

      // Check if email already exists in Subscribers sheet
      const data = subSheet.getDataRange().getValues();
      const lowerEmail = email.toLowerCase();
      let alreadyExists = false;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][1]).trim().toLowerCase() === lowerEmail) {
          alreadyExists = true;
          break;
        }
      }

      if (alreadyExists) {
        return createJsonResponse({
          status: 'already_subscribed',
          alreadySubscribed: true,
          message: 'Tu na already list me hain chill kr',
          data: { email: email }
        });
      }

      // Append subscriber row: [Date, Email, IP, Location, Local Time, Source]
      subSheet.appendRow([date, email, ip, location, formattedDate, source]);

      return createJsonResponse({
        status: 'success',
        message: 'Email stored successfully',
        data: { email: email, date: date, ip: ip, location: location }
      });
    }

    // --------------------------------------------------------------------------
    // ACTION: ENGAGEMENT (VIEWS & LIKES STATS)
    // --------------------------------------------------------------------------
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let statsSheet = ss.getSheetByName(STATS_SHEET_NAME);
    if (!statsSheet) {
      statsSheet = ss.getSheets()[0]; // Default to the first sheet if Stats tab not named
    }

    if (action === 'like' || action === 'view') {
      const pieceId = (params.pieceId || '').trim();
      if (!pieceId) {
        return createJsonResponse({ status: 'error', message: 'pieceId is required' });
      }

      const isLike = action === 'like';
      const likedState = params.liked === true || params.liked === 'true';

      // Read sheet rows
      const data = statsSheet.getDataRange().getValues();
      let rowIndex = -1;

      // Find piece row (assuming Column A is pieceId, Column B is Views, Column C is Likes)
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === pieceId) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex === -1) {
        // New piece entry
        const initViews = isLike ? 0 : 1;
        const initLikes = isLike && likedState ? 1 : 0;
        statsSheet.appendRow([pieceId, initViews, initLikes]);
      } else {
        if (isLike) {
          const currentLikes = Number(statsSheet.getRange(rowIndex, 3).getValue()) || 0;
          const delta = likedState ? 1 : -1;
          statsSheet.getRange(rowIndex, 3).setValue(Math.max(0, currentLikes + delta));
        } else {
          const currentViews = Number(statsSheet.getRange(rowIndex, 2).getValue()) || 0;
          statsSheet.getRange(rowIndex, 2).setValue(currentViews + 1);
        }
      }
    }

    // Return updated stats
    const updatedStats = getStatsMap(statsSheet);
    return createJsonResponse({ status: 'success', stats: updatedStats });

  } catch (error) {
    return createJsonResponse({ status: 'error', error: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// =============================================================================
// POETRY SHEET SETUP: Ensures "Poetry" sheet exists with correct headers
// =============================================================================
function ensurePoetrySheet(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  let poetrySheet = ss.getSheetByName(POETRY_SHEET_NAME);

  // Auto-create "Poetry" sheet with headers if missing
  // User column structure: content | content_hi | id | category | title | title_hi | date | excerpt | status | views | likes
  const headers = ["content", "content_hi", "id", "category", "title", "title_hi", "date", "excerpt", "status", "views", "likes"];

  if (!poetrySheet) {
    poetrySheet = ss.insertSheet(POETRY_SHEET_NAME);
    poetrySheet.appendRow(headers);

    const headerRange = poetrySheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#326ccb");
    headerRange.setFontColor("#f8fafc");
    headerRange.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    poetrySheet.setFrozenRows(1);
    poetrySheet.setColumnWidth(1, 450);  // content
    poetrySheet.setColumnWidth(2, 450);  // content_hi
    poetrySheet.setColumnWidth(3, 180);  // id
    poetrySheet.setColumnWidth(4, 100);  // category
    poetrySheet.setColumnWidth(5, 250);  // title
    poetrySheet.setColumnWidth(6, 250);  // title_hi
    poetrySheet.setColumnWidth(7, 100);  // date
    poetrySheet.setColumnWidth(8, 300);  // excerpt
    poetrySheet.setColumnWidth(9, 100);  // status
    poetrySheet.setColumnWidth(10, 80);  // views
    poetrySheet.setColumnWidth(11, 80);  // likes
  }

  return poetrySheet;
}

// =============================================================================
// POETRY CMS: Read published poems from the "Poetry" sheet
// Dynamically maps columns by header name (supports new and legacy orders)
// =============================================================================
function handleGetPoetry() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let poetrySheet = ensurePoetrySheet(ss);

  const allData = poetrySheet.getDataRange().getValues();
  if (allData.length < 2) {
    return createJsonResponse({
      status: 'success',
      poetry: [],
      total: 0,
      message: 'Poetry sheet is empty. Add some poems!'
    });
  }

  // Row 1 contains headers
  const headers = allData[0].map(function(h) { return String(h || '').trim().toLowerCase(); });

  function findCol(name, altNames, fallbackIdx) {
    const idx = headers.indexOf(name.toLowerCase());
    if (idx !== -1) return idx;
    if (Array.isArray(altNames)) {
      for (let k = 0; k < altNames.length; k++) {
        const altIdx = headers.indexOf(altNames[k].toLowerCase());
        if (altIdx !== -1) return altIdx;
      }
    }
    return fallbackIdx;
  }

  // Column positions:
  // User's layout: content(0) | content_hi(1) | id(2) | category(3) | title(4) | title_hi(5) | date(6) | excerpt(7) | status(8) | views(9) | likes(10)
  const colContent   = findCol('content', ['poem', 'body', 'english_content'], 0);
  const colContentHi = findCol('content_hi', ['hindi_content', 'content_hindi'], 1);
  const colId        = findCol('id', ['slug', 'poem_id'], 2);
  const colCategory  = findCol('category', ['type', 'genre'], 3);
  const colTitle     = findCol('title', ['name', 'poem_title'], 4);
  const colTitleHi   = findCol('title_hi', ['hindi_title', 'title_hindi'], 5);
  const colDate      = findCol('date', ['published_date', 'month_year'], 6);
  const colExcerpt   = findCol('excerpt', ['summary', 'preview'], 7);
  const colStatus    = findCol('status', ['state'], 8);
  const colViews     = findCol('views', ['view_count'], 9);
  const colLikes     = findCol('likes', ['like_count'], 10);

  // Check Stats sheet for live views/likes counters
  let statsMap = {};
  const statsSheet = ss.getSheetByName(STATS_SHEET_NAME);
  if (statsSheet) {
    statsMap = getStatsMap(statsSheet);
  }

  const poems = [];

  for (let i = 1; i < allData.length; i++) {
    const row = allData[i];

    let content = String(row[colContent] || '').trim();
    let contentHi = String(row[colContentHi] || '').trim();
    let id = String(row[colId] || '').trim();
    let category = String(row[colCategory] || 'Poetry').trim();
    let title = String(row[colTitle] || '').trim();
    let titleHi = String(row[colTitleHi] || '').trim();
    let date = String(row[colDate] || '').trim();
    let excerpt = String(row[colExcerpt] || '').trim();
    let status = String(row[colStatus] || '').trim().toLowerCase();

    // Auto-generate ID slug from title if id column was empty
    if (!id && title) {
      id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    // Skip empty rows and drafts
    if (!id && !title && !content) continue;
    if (status !== 'published' && status !== '') continue;
    if (status === 'draft') continue;

    let views = (colViews !== -1 && !isNaN(Number(row[colViews]))) ? Number(row[colViews]) : 0;
    let likes = (colLikes !== -1 && !isNaN(Number(row[colLikes]))) ? Number(row[colLikes]) : 0;

    if (statsMap[id]) {
      views = Math.max(views, statsMap[id].views || 0);
      likes = Math.max(likes, statsMap[id].likes || 0);
    }

    poems.push({
      id: id,
      category: category || 'Poetry',
      title: title || id,
      title_hi: titleHi,
      date: date,
      excerpt: excerpt,
      content: content,
      content_hi: contentHi,
      views: views,
      likes: likes
    });
  }

  return createJsonResponse({
    status: 'success',
    poetry: poems,
    total: poems.length
  });
}

function getStatsMap(sheet) {
  const stats = {};
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][0]).trim();
    if (id) {
      stats[id] = {
        views: Number(data[i][1]) || 0,
        likes: Number(data[i][2]) || 0
      };
    }
  }
  return stats;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
