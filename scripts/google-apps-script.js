  /**
  * ==============================================================================
  * GOOGLE APPS SCRIPT: Engagement Stats & Email Subscriber Webhook
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
  * That's it! Emails will be recorded in a clean "Subscribers" sheet tab automatically.
  * ==============================================================================
  */

  const SUBSCRIBERS_SHEET_NAME = "Subscribers";
  const STATS_SHEET_NAME = "Stats";

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
      // ACTION: SUBSCRIBE EMAIL
      // --------------------------------------------------------------------------
      if (action === 'subscribe_email' || action === 'subscribe' || params.email) {
        const email = (params.email || '').trim();
        const ip = (params.ip || 'Unavailable').trim();
        const date = (params.date || new Date().toISOString()).trim();
        const formattedDate = (params.formattedDate || new Date().toLocaleString()).trim();
        const source = (params.source || 'website').trim();

        if (!email) {
          return createJsonResponse({ status: 'error', message: 'Email is required' });
        }

        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let subSheet = ss.getSheetByName(SUBSCRIBERS_SHEET_NAME);

        // Create "Subscribers" sheet if it does not exist
        if (!subSheet) {
          subSheet = ss.insertSheet(SUBSCRIBERS_SHEET_NAME);
          const headers = ["Date", "Email", "IP", "Local Time", "Source"];
          subSheet.appendRow(headers);

          // Style header row
          const headerRange = subSheet.getRange(1, 1, 1, headers.length);
          headerRange.setFontWeight("bold");
          headerRange.setBackground("#111827");
          headerRange.setFontColor("#f9fafb");
          subSheet.setFrozenRows(1);
          subSheet.autoResizeColumns(1, headers.length);
        }

        // Append subscriber row: [Date, Email, IP, Local Time, Source]
        subSheet.appendRow([date, email, ip, formattedDate, source]);

        return createJsonResponse({
          status: 'success',
          message: 'Email stored successfully',
          data: { email: email, date: date, ip: ip }
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
