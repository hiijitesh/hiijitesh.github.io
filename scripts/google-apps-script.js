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
 * HOW TO ADD DEFAULT POEMS TO YOUR SHEET:
 * Option A (One-click in Apps Script):
 *   In the function dropdown at the top of Apps Script, select "seedDefaultPoetry"
 *   and click the "Run" button. It will add all default poems into your Poetry tab!
 * Option B (Via Browser URL):
 *   Visit: <YOUR_APPS_SCRIPT_URL>?action=seed_defaults
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

/**
 * Default poems library for seeding and populating the Google Sheet
 */
const DEFAULT_POETRY = [
  {
    id: "mere-soch-pare-bhi",
    category: "Poetry",
    title: "Mere Soch Pare Bhi, Kuch Hona Hain",
    title_hi: "मेरे सोच परे भी, कुछ होना हैं",
    date: "Aug 2024",
    excerpt: "Ek samay tha jahan sab kuch naa paane ka bhay tha, ek aaj waqt hain jaha sab kuch hoke bhi jindgi lagti kamwaqt hain...",
    content: "Ek samay tha jahan,\nSab kuch naa paane ka bhay tha\n\nEk aaj waqt hain, jaha sab kuch hoke bhi\nJindgi, lagti kamwaqt hain!!!\n\nKuch paya, toh kuch khoya hu\nKuch paya, toh kuch khoya hu\nDil jab jab na laga, tab tab roya hu.\n\nSapne dekhe bade udaan ke hain,\nPar main toh yunhi soya hu.\nDil jab jab na laga, tab tab roya hu.\n\nPata hota agar, kuch paane ko, kuch khona hain!\nMere सोच pare bhi, kuch hona hain.\n\nSambhaal ke rakhata uss pal ko, jo khaas the\nJab pata hota isko bhi, ek din khona hain.\nMere soch pare bhi, kuch hona hain.",
    content_hi: "एक समय था जहाँ,\nसब कुछ ना पाने का भय था\n\nएक आज वक़्त हैं, जहाँ सब कुछ होके भी\nजिंदगी, लगती कमबख्त हैं!!!\n\nकुछ पाया, तोह कुछ खोया हूँ\nकुछ पाया, तोह कुछ खोया हूँ\nदिल जब जब ना लगा, तब तब रोया हूँ।\n\nसपने देखे बड़े उड़ान के हैं,\nपर मैं तोह यूँही सोया हूँ।\nदिल जब जब ना लगा, तब तब रोया हूँ।\n\nपता होता अगर, कुछ पाने को, कुछ खोना हैं!\nमेरे सोच परे भी, कुछ होना हैं।\n\nसंभाल के रखता उस पल को, जो ख़ास थे\nजब पता होता इसको भी, एक दिन खोना हैं।\nमेरे सोच परे भी, कुछ होना हैं।",
    status: "Published"
  },
  {
    id: "kuch-khayaal-aise-hain",
    category: "Nazm",
    title: "Kuch Khayaal Aise Hain",
    title_hi: "कुछ ख़्याल ऐसे हैं",
    date: "Oct 2026",
    excerpt: "Kuch khayal aise hain jo meet nahi patein, kuch shaam aisi hain jo dhal nahi patein. Log toh charo taraf hain lekin fir sab me hum ghool meel nahi patein...",
    content: "Kuch khayal aise hain jo meet nahi patein\nKuch shaam aisi hain jo dhal nahi patein\n\nLog toh charo taraf hain\nLekin fir sab me hum ghool meel nahi patein\n\nBahar bheed ka nazaraa hain toh\nUnder jhanka toh sukha kinaara hain\n\nKuch khayal aise hain jo meet nahi patein\nKuch shaam aisi hain jo dhal nahi patein\n\nKabhi aarzoo hoti hain apno ki,\nFir lagta sab thik ho jayegaa\nPar ye toh waqat he batayega, \nLagta hain ye zindgi yuhi, \nTanha kat jayega\n\nSapne toh hazaar hain, \nBahut he besoomar hain \nSapno ko pana hain ya apno ko, \nYe सोच ke dil av bhi bekaraar hain\n\nAnshu toh dil me aatein hain, \nAnkho ki aukaat kya hain\nSochata hu ro lu jee bhar ke,\nPar itna v ye aashaan kahan hain\n\nKuch khayal aise hain jo meet nahi patein\nKuch shaam aisi hain jo dhal nahi patein",
    content_hi: "कुछ ख़्याल ऐसे हैं जो मिट नहीं पाते\nकुछ शाम ऐसी हैं जो ढल नहीं पाते\n\nलोग तो चारों तरफ हैं\nलेकिन फिर सब में हम घुल मिल नहीं पाते\n\nबाहर भीड़ का नज़ारा हैं तो\nअंदर झाँका तो सूखा किनारा हैं\n\nकुछ ख़्याल ऐसे हैं जो मिट नहीं पाते\nकुछ शाम ऐसी हैं जो ढल नहीं पाते\n\nकभी आरज़ू होती हैं अपनों की,\nफिर लगता सब ठीक हो जाएगा\nपर ये तो वक़्त ही बताएगा,\nलगता हैं ये ज़िंदगी यूँही,\nतन्हा कट जाएगी\n\nसपने तो हज़ार हैं,\nबहुत ही बेशुमार हैं\nसपनों को पाना हैं या अपनों को,\nये सोच के दिल अब भी बेक़रार हैं\n\nआँसू तो दिल में आते हैं,\nआँखों की औक़ात क्या हैं\nसोचता हूँ रो लूँ जी भर के,\nपर इतना भी ये आसान कहाँ हैं\n\nकुछ ख़्याल ऐसे हैं जो मिट नहीं पाते\nकुछ शाम ऐसी हैं जो ढल नहीं पाते",
    status: "Published"
  },
  {
    id: "kahani-me-kuch-khaas-nahi",
    category: "Shayari",
    title: "Kahani Me Kuch Khaas Nahi",
    title_hi: "कहानी में कुछ ख़ास नहीं",
    date: "Oct 2026",
    excerpt: "kahani me ab kuch khaas nahi, ab woh pahale wali baat nahi. phone pe hoti baat sahi, par hoti koi ab mulakaat nahi...",
    content: "kahani me ab kuch khaas nahi\nab woh pahale wali baat nahi\nphone pe hoti baat sahi\npar hoti koi ab mulakaat nahi\n\nab pahale wale jazbaat nahi\nJeevan me ab koi raas nahi\npta chalta din raat nahi\nkahani me ab kuch khaas nahi",
    content_hi: "कहानी में अब कुछ ख़ास नहीं\nअब वो पहले वाली बात नहीं\nफ़ोन पे होती बात सही\nपर होती कोई अब मुलाक़ात नहीं\n\nअब पहले वाले जज़्बात नहीं\nजीवन में अब कोई रास नहीं\nपता चलता दिन रात नहीं\nकहानी में अब कुछ ख़ास नहीं",
    status: "Published"
  },
  {
    id: "tum-woh-ehsaas-ho",
    category: "Nazm",
    title: "Tum Woh Ehsaas Ho",
    title_hi: "तुम वो एहसास हो",
    date: "Oct 2026",
    excerpt: "Tum woh ehsaas ho jo pal pal mere saath ho. Kabhi sochta hu ek din kaise katega tum bin, magar sach toh ye hain ki ek pal bhi sadiyo sa lagega...",
    content: "Tum woh ehsaas ho\njo pal pal mere saath ho\n\nkabhi sochta hu ek din\nkaise katega tum bin,\nmagar sach toh ye hain ki\nek pal bhi sadiyo sa lagea\n7 janam sa ek ek din\n\ntum woh aadat ban gayi ho\njisko main gum me khushi me\njeev jantu sab me dhudhata hun\n\nguzaara nahi hota mera\ntum bin ek pal, kyuki\nsahaaraa ho tum mere pal pal ka\n\nlikhana chahatu bahut kuch tumhare baare me\nmagar keh du kya tumhe dundha nahi main Chand sitaaro me\nek chhoti si aarzu hain, tum hamesha raho meri baaho me\n\nkalaa ki kami hain, nahi toh likh du tumpe\nwoh nazam, shayri aur kitaab\nmagar tumhe dekh ke sab bhool jata hu\nkuchh iss tarah pyaar hua hain aap se janbab",
    content_hi: "तुम वो एहसास हो\nजो पल पल मेरे साथ हो\n\nकभी सोचता हूँ एक दिन\nकैसे कटेगा तुम बिन,\nमगर सच तो ये हैं कि\nएक पल भी सदियों सा लगेगा\nसात जनम सा एक एक दिन\n\nतुम वो आदत बन गयी हो\nजिसको मैं ग़म में ख़ुशी में\nजीव जंतु सब में ढूँढता हूँ\n\nगुज़ारा नहीं होता मेरा\nतुम बिन एक पल, क्योंकि\nसहारा हो तुम मेरे पल पल का\n\nलिखना चाहता हूँ बहुत कुछ तुम्हारे बारे में\nमगर कह दूँ क्या तुम्हें ढूँढा नहीं मैंने चाँद सितारों में\nएक छोटी सी आरज़ू हैं, तुम हमेशा रहो मेरी बाहों में\n\nकला की कमी हैं, नहीं तो लिख दूँ तुमपे\nवो नज़्म, शायरी और किताब\nमगर तुम्हें देख के सब भूल जाता हूँ\nकुछ इस तरह प्यार हुआ हैं आप से जनाब",
    status: "Published"
  },
  {
    id: "lahare",
    category: "Poetry",
    title: "Lahare",
    title_hi: "लहरें",
    date: "Oct 2026",
    excerpt: "ye jo lahare uthi main mere under tak, jaa fekegi mujhe samandar tak...",
    content: "ye jo lahare uthi main mere under tak\njaa fekegi mujhe samandar tak\n\nbheed me v ek tufaan umarati hain mere under\nsochata hu ki kya sochu ki sochana band krdu\n\npar ye mahaj soch nahi, dil ki laihar hain\ntu khud ko na tarash raha, baitha tu udaas rahaa",
    content_hi: "ये जो लहरें उठी हैं मेरे अंदर तक,\nजा फेंकेंगी मुझे समंदर तक।\n\nभीड़ में भी एक तूफान उमड़ती हैं मेरे अंदर,\nसोचता हूँ कि क्या सोचूँ कि सोचना बंद कर दूँ।\n\nपर ये महज सोच नहीं, दिल की लहर हैं,\nतू खुद को ना तराश रहा, बैठा तू उदास रहा।",
    status: "Published"
  }
];

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
    // ACTION: SEED DEFAULT POEMS (Appends default poems if missing from Poetry tab)
    // --------------------------------------------------------------------------
    if (action === 'seed_defaults' || action === 'seed_poetry') {
      const result = seedDefaultPoetry();
      return createJsonResponse(result);
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
// POETRY SEEDER: Adds default poems to "Poetry" sheet without duplicating
// =============================================================================
function seedDefaultPoetry() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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

  // Read existing headers to find the ID column dynamically
  const existingData = poetrySheet.getDataRange().getValues();
  const headerRow = existingData.length > 0 
    ? existingData[0].map(function(h) { return String(h || '').trim().toLowerCase(); })
    : [];
  let idColIndex = headerRow.indexOf('id');
  if (idColIndex === -1) idColIndex = 2; // Default to Col C (index 2) in new layout

  const existingIds = {};
  for (let i = 1; i < existingData.length; i++) {
    const existingId = String(existingData[i][idColIndex] || '').trim().toLowerCase();
    if (existingId) {
      existingIds[existingId] = true;
    }
  }

  let addedCount = 0;
  for (let j = 0; j < DEFAULT_POETRY.length; j++) {
    const p = DEFAULT_POETRY[j];
    if (!existingIds[p.id.toLowerCase()]) {
      poetrySheet.appendRow([
        p.content,
        p.content_hi,
        p.id,
        p.category,
        p.title,
        p.title_hi,
        p.date,
        p.excerpt,
        p.status || 'Published',
        p.views || 0,
        p.likes || 0
      ]);
      existingIds[p.id.toLowerCase()] = true;
      addedCount++;
    }
  }

  return {
    status: 'success',
    added: addedCount,
    totalExisting: Object.keys(existingIds).length,
    message: addedCount > 0 
      ? ("Successfully added " + addedCount + " default poem(s) to Poetry sheet!")
      : "All default poems are already present in Poetry sheet."
  };
}

// =============================================================================
// POETRY CMS: Read published poems from the "Poetry" sheet
// Dynamically maps columns by header name (supports new and legacy orders)
// =============================================================================
function handleGetPoetry() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let poetrySheet = ss.getSheetByName(POETRY_SHEET_NAME);

  // If sheet doesn't exist, create it and seed defaults
  if (!poetrySheet) {
    seedDefaultPoetry();
    poetrySheet = ss.getSheetByName(POETRY_SHEET_NAME);
  }

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
