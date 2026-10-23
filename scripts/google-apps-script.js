/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: Engagement Stats, Email Subscribers & Poetry CMS
 * ==============================================================================
 *
 * HOW TO INSTALL / UPDATE IN GOOGLE SHEETS:
 * 1. Open your Google Sheet (e.g. where your views & likes are recorded).
 * 2. In the top menu, go to: Extensions > Apps Script.
 * 3. Replace all code in "Code.gs" with this complete script.
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
 *    A: id             (unique slug, e.g. "mere-soch-pare-bhi")
 *    B: category       (Poetry / Nazm / Shayari)
 *    C: title          (Hinglish title)
 *    D: title_hi       (Hindi title in Devanagari)
 *    E: date           (display date, e.g. "Oct 2026")
 *    F: excerpt        (1–2 line preview in Hinglish)
 *    G: content        (full poem body — Hinglish. Use Alt+Enter for newlines inside a cell)
 *    H: content_hi     (full poem body — Hindi Devanagari)
 *    I: status         (Published / Draft — only "Published" poems are shown on the website)
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
// POETRY CMS: Read published poems from the "Poetry" sheet
// =============================================================================
function handleGetPoetry() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let poetrySheet = ss.getSheetByName(POETRY_SHEET_NAME);

  // Auto-create "Poetry" sheet with headers if it doesn't exist
  if (!poetrySheet) {
    poetrySheet = ss.insertSheet(POETRY_SHEET_NAME);
    const headers = ["id", "category", "title", "title_hi", "date", "excerpt", "content", "content_hi", "status"];
    poetrySheet.appendRow(headers);

    // Style header row
    const headerRange = poetrySheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#326ccbff");
    headerRange.setFontColor("#f8fafc");
    headerRange.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    poetrySheet.setFrozenRows(1);
    poetrySheet.setColumnWidth(1, 180);  // id
    poetrySheet.setColumnWidth(2, 100);  // category
    poetrySheet.setColumnWidth(3, 250);  // title
    poetrySheet.setColumnWidth(4, 250);  // title_hi
    poetrySheet.setColumnWidth(5, 100);  // date
    poetrySheet.setColumnWidth(6, 350);  // excerpt
    poetrySheet.setColumnWidth(7, 500);  // content
    poetrySheet.setColumnWidth(8, 500);  // content_hi
    poetrySheet.setColumnWidth(9, 100);  // status

    // Add a sample note on the first data row
    poetrySheet.getRange(2, 1).setNote("Fill each row with one poem. Set status to 'Published' when ready to show on website.");

    return createJsonResponse({
      status: 'success',
      poetry: [],
      message: 'Poetry sheet created! Add poems to the "Poetry" tab in your Google Sheet.'
    });
  }

  const lastRow = poetrySheet.getLastRow();
  if (lastRow < 2) {
    return createJsonResponse({
      status: 'success',
      poetry: [],
      message: 'Poetry sheet is empty. Add some poems!'
    });
  }

  const data = poetrySheet.getRange(2, 1, lastRow - 1, 9).getValues();
  const poems = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const id = String(row[0] || '').trim();
    const status = String(row[8] || '').trim().toLowerCase();

    // Skip empty rows and drafts
    if (!id) continue;
    if (status !== 'published' && status !== '') continue;
    // If status is explicitly "draft", skip
    if (status === 'draft') continue;

    poems.push({
      id: id,
      category: String(row[1] || 'Poetry').trim(),
      title: String(row[2] || '').trim(),
      title_hi: String(row[3] || '').trim(),
      date: String(row[4] || '').trim(),
      excerpt: String(row[5] || '').trim(),
      content: String(row[6] || '').trim(),
      content_hi: String(row[7] || '').trim(),
      views: 0,
      likes: 0
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
