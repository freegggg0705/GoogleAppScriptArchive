//JINA_GAS.gs using JINA fetch html then use Google appscript to fetch the html through regex (For 403 blocking google appscript politepol and fetchrss and without usable to use)


/**
 * CONFIG123uration object for flexibility in sheet name, start row/column, and fields to extract.
 * Modify this to change the sheet, starting position, or add more fields.
 */
const CONFIG123 = {
  sheetName: "Sheet3",
  startRow: 4,
  startColumn: 1,
  apiUrl: "https://r.jina.ai/https://linux.do/top?period=weekly",
  apiKey: "jina_de33d50dcfbf48908254cae3e600787cWzYo8GDgCdUcWqN_IYkpLf8U78HS",
  fields: [
    { key: "href", regex: /<a href=\"([^\"]+)\"[^>]*class=\"title raw-link raw-topic-link\"/ },
    { key: "title", regex: /<span dir=\"auto\">([^<]+)<\/span>/ },
    { key: "tags", regex: /<div class=\"discourse-tags\"[^>]*>([\s\S]*?)<\/div>/, process: (match) => {
        if (!match) return "";
        const tagMatches = match[1].matchAll(/data-tag-name=\"([^\"]+)\"/g);
        return Array.from(tagMatches).map(m => m[1]).join("|");
      }
    },
    { key: "date_info", regex: /<td title=\"([^\"]+)\"[^>]*class=\"activity num topic-list-data age\"/ }
  ]
};

/**
 * Main function to fetch data from Jina API, parse HTML, and append to Google Sheet.
 */
function fetchAndAppendToSheet2() {
  try {
    // Fetch HTML from Jina API
    const options = {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": "Bearer " + CONFIG123.apiKey,
        "X-Return-Format": "html"
      }
    };
    const response = UrlFetchApp.fetch(CONFIG123.apiUrl, options);
    const json = JSON.parse(response.getContentText());
    const html = json.data.html;

    // Test regex compilation
    try {
      CONFIG123.fields.forEach(field => {
        if (field.regex) "".match(field.regex); // Test regex
        Logger.log(`Regex for ${field.key} compiled successfully`);
      });
    } catch (e) {
      Logger.log(`Regex compilation error: ${e}`);
      return;
    }

    // Extract data using regex for tbody
    const tbodyRegex = /<tbody class=\"topic-list-body\">([\s\S]*?)<\/tbody>/i;
    const tbodyMatch = html.match(tbodyRegex);
    if (!tbodyMatch) {
      Logger.log("Error: <tbody class='topic-list-body'> not found");
      return;
    }
    const tbodyContent = tbodyMatch[1];

    // Extract <tr> elements
    const trRegex = /<tr data-topic-id=\"\d+\"[^>]*>([\s\S]*?)<\/tr>/gi;
    const trMatches = tbodyContent.matchAll(trRegex);
    let newData = [];

    // Process each <tr> element
    for (const tr of trMatches) {
      const trContent = tr[1]; // Capture group for <tr> content
      let rowData = { "Google Create Date": new Date().toISOString() };

      // Extract each field defined in CONFIG123.fields
      CONFIG123.fields.forEach(field => {
        try {
          const match = trContent.match(field.regex);
          rowData[field.key] = field.process ? field.process(match) : (match ? match[1] : "");
        } catch (e) {
          Logger.log(`Error in regex for ${field.key}: ${e}`);
          rowData[field.key] = "";
        }
      });

      // Only add row if at least one field (besides timestamp) has data
      if (Object.keys(rowData).some(key => key !== "Google Create Date" && rowData[key])) {
        newData.push(rowData);
      }
    }

    // Get spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG123.sheetName);
    if (!sheet) {
      Logger.log("Error: Sheet '" + CONFIG123.sheetName + "' not found");
      return;
    }

    // Get existing data
    const lastRow = sheet.getLastRow();
    const startRow = Math.max(CONFIG123.startRow, 1);
    let existingData = [];
    let headers = ["Google Create Date"].concat(CONFIG123.fields.map(field => field.key));
    if (lastRow >= startRow) {
      const range = sheet.getRange(startRow, CONFIG123.startColumn, lastRow - startRow + 1, headers.length);
      existingData = range.getValues().map(row => {
        let obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] || "";
        });
        return obj;
      });
    }

    // Append new data
    let allData = existingData.concat(newData);

    // Remove duplicates based on href
    const uniqueData = [];
    const seenHrefs = new Set();
    allData.forEach(row => {
      if (!seenHrefs.has(row.href)) {
        seenHrefs.add(row.href);
        uniqueData.push(row);
      }
    });

    // Sort by Google Create Date (latest first)
    uniqueData.sort((a, b) => new Date(b["Google Create Date"]) - new Date(a["Google Create Date"]));

    // Write headers if sheet is empty or headers don't exist
    if (lastRow < startRow) {
      sheet.getRange(startRow, CONFIG123.startColumn, 1, headers.length).setValues([headers]);
    }

    // Convert uniqueData to 2D array for writing
    const values = uniqueData.map(row => headers.map(header => row[header] || ""));
    if (values.length > 0) {
      sheet.getRange(startRow + 1, CONFIG123.startColumn, values.length, values[0].length).setValues(values);
    }

    Logger.log("Appended " + newData.length + " new rows, total " + uniqueData.length + " unique rows after sorting and deduplication");
  } catch (e) {
    Logger.log("Error: " + e);
  }
}
