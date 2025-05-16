// api1.gs: dynamic column, with google create date, sort by google create date latest to oldest , remove duplicate by string(thread_id), decode hex for chinese (Update old entires use) 

const CONFIGMNO = {
  API_URL: "https://lihkg.com/api_v2/thread/latest?cat_id=1&page={page}&count=60&type=now&order=hot",
  PAGE_RANGE: { start: 1, end: 6 }, // Added page range for pages 1 to 3
  SHEET_NAME: "now",
  START_ROW: 4,
  START_COLUMN: 1,
  ITEMS_TO_EXTRACT: 60
};

function scrapeLIHKG1() {
  const options = {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Referer": "https://lihkg.com/category/1",
      "Accept-Language": "en-US,en;q=0.9",
      "X-Requested-With": "XMLHttpRequest"
    },
    muteHttpExceptions: true
  };

  try {
    let allThreads = [];
    
    // Loop through pages defined in PAGE_RANGE
    for (let page = CONFIGMNO.PAGE_RANGE.start; page <= CONFIGMNO.PAGE_RANGE.end; page++) {
      const apiUrl = CONFIGMNO.API_URL.replace("{page}", page);
      Logger.log(`Attempting to access API for page ${page}: ${apiUrl}`);
      
      const response = UrlFetchApp.fetch(apiUrl, options);
      const status = response.getResponseCode();
      if (status !== 200) {
        Logger.log(`HTTP error on page ${page}: ${status}`);
        continue; // Skip to next page on error
      }
      Logger.log(`Successfully accessed API for page ${page}`);

      const json = JSON.parse(response.getContentText());
      if (!json.success || !json.response || !Array.isArray(json.response.items)) {
        Logger.log(`API error on page ${page}: ${JSON.stringify(json)}`);
        continue;
      }
      Logger.log(`Successfully retrieved ${json.response.items.length} items from API on page ${page}`);

      // Extract and process threads for current page
      const threads = json.response.items.slice(0, CONFIGMNO.ITEMS_TO_EXTRACT).map(thread => {
        const decodedThread = { ...thread };
        if (decodedThread.title) {
          decodedThread.title = decodeTitle(decodedThread.title);
        }
        if (decodedThread.thread_id) {
          decodedThread.thread_id = decodedThread.thread_id.toString();
        }
        if (decodedThread.thread_id) {
          decodedThread.url = `https://lihkg.com/thread/${decodedThread.thread_id}`;
        }
        decodedThread.google_create_date = new Date().toISOString();
        return decodedThread;
      });

      allThreads = allThreads.concat(threads);
      Logger.log(`Completed scraping page ${page}, collected ${threads.length} threads`);
    }

    Logger.log(`Total threads collected from all pages: ${allThreads.length}`);
    
    // Write to Sheet with sorting and deduplication
    writeToSheet(allThreads);
    Logger.log(`Scraped ${allThreads.length} threads successfully across all pages`);
  } catch (error) {
    Logger.log(`Error: ${error}`);
  }
}

function decodeTitle(encoded) {
  try {
    return encoded.replace(/\\u([\dA-Fa-f]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
  } catch (e) {
    Logger.log(`Title decode error: ${e}`);
    return encoded;
  }
}

function writeToSheet(newThreads) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet;
  try {
    sheet = spreadsheet.getSheetByName(CONFIGMNO.SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIGMNO.SHEET_NAME);
    }
  } catch (e) {
    Logger.log(`Sheet access error: ${e}`);
    return;
  }

  const startRow = CONFIGMNO.START_ROW;
  const startColumn = CONFIGMNO.START_COLUMN;
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  let existingData = [];
  let headers = [];

  const allKeys = new Set();
  newThreads.forEach(thread => {
    Object.keys(thread).forEach(key => allKeys.add(key));
  });
  headers = Array.from(allKeys);

  if (lastRow >= startRow && lastCol >= startColumn) {
    const range = sheet.getRange(startRow, startColumn, lastRow - startRow + 1, lastCol - startColumn + 1);
    existingData = range.getValues();
    if (lastCol >= startColumn) {
      const existingHeaders = sheet.getRange(startRow - 1, startColumn, 1, lastCol - startColumn + 1).getValues()[0];
      existingHeaders.forEach(header => {
        if (header && !allKeys.has(header)) {
          headers.push(header);
        }
      });
    }
  }

  if (headers.length > 0) {
    sheet.getRange(startRow - 1, startColumn, 1, headers.length).setValues([headers]);
  }

  const existingThreads = existingData
    .filter(row => row.some(cell => cell !== ""))
    .map(row =>
      headers.reduce((obj, key, i) => ({ ...obj, [key]: row[i] || "" }), {})
    );

  const existingThreadIds = existingThreads.map(thread => thread.thread_id).filter(id => id);
  Logger.log(`Existing thread IDs: ${existingThreadIds.join(", ") || "none"}`);

  const newThreadIds = newThreads.map(thread => thread.thread_id).filter(id => id);
  Logger.log(`New thread IDs: ${newThreadIds.join(", ") || "none"}`);

  const allThreads = [...newThreads, ...existingThreads];

  allThreads.sort((a, b) => {
    const dateA = a.google_create_date ? new Date(a.google_create_date) : new Date(0);
    const dateB = b.google_create_date ? new Date(b.google_create_date) : new Date(0);
    return dateB - dateA;
  });

  const uniqueThreads = [];
  const seenThreadIds = new Set();
  for (const thread of allThreads) {
    const threadId = thread.thread_id ? thread.thread_id.toString() : null;
    if (threadId && !seenThreadIds.has(threadId)) {
      seenThreadIds.add(threadId);
      uniqueThreads.push(thread);
    }
  }

  const deduplicatedThreadIds = uniqueThreads.map(thread => thread.thread_id).filter(id => id);
  Logger.log(`Thread IDs after deduplication: ${deduplicatedThreadIds.join(", ") || "none"}`);

  if (uniqueThreads.length > 0) {
    const dataToWrite = uniqueThreads.map(thread =>
      headers.map(key => thread[key] || "")
    );
    if (lastRow >= startRow) {
      sheet.getRange(startRow, startColumn, lastRow - startRow + 1, lastCol - startColumn + 1).clearContent();
    }
    sheet.getRange(startRow, startColumn, dataToWrite.length, headers.length).setValues(dataToWrite);
    Logger.log(`Wrote ${dataToWrite.length} unique threads`);
  } else {
    Logger.log("No threads to write");
  }
}
