// RSS feed append only , not refreshing old items record , dynamic column creating, google create date creating (For append use)

function appendFeedSortDedupe3() {
  // Get the spreadsheet and target sheet
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName("SHEET9");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: SHEET9 not found.");
    return;
  }

  // URL of the RSS feed
  var feedUrl = "https://sspai.com/feed";

  // Fetch and parse RSS feed
  var xml = UrlFetchApp.fetch(feedUrl).getContentText();
  var document = XmlService.parse(xml); // Corrected line
  var root = document.getRootElement();
  var channel = root.getChild("channel");
  var items = channel.getChildren("item");

  // Dynamically determine headers from the first item
  var firstItem = items[0];
  var children = firstItem.getChildren();
  var headers = children.map(child => child.getName());
  headers.push("google_create_date"); // Add google_create_date column

  // Check if headers are already set in A4
  var existingHeaders = sheet.getRange(4, 1, 1, headers.length).getValues()[0];
  var headersMatch = existingHeaders.length === headers.length && existingHeaders.every((val, i) => val === headers[i]);

  // Write headers to A4 if they don't exist or don't match
  if (!headersMatch) {
    sheet.getRange(4, 1, 1, headers.length).setValues([headers]);
  }

  // Read existing URLs to avoid duplicates
  var lastRow = sheet.getLastRow();
  var existingData = lastRow >= 5 ? sheet.getRange(5, 1, lastRow - 4, headers.length).getValues() : [];
  var linkColumnIndex = headers.indexOf("link") !== -1 ? headers.indexOf("link") : -1;
  var existingUrls = {};

  if (linkColumnIndex !== -1) {
    existingData.forEach(row => {
      var url = row[linkColumnIndex];
      if (url) existingUrls[url] = true;
    });
  }

  // Prepare new feed data (only unique items)
  var newData = [];
  var currentDate = new Date(); // For google_create_date

  // Extract data dynamically for each feed item
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var url = linkColumnIndex !== -1 ? item.getChildText("link") || "" : "";

    // Skip if URL already exists
    if (linkColumnIndex !== -1 && existingUrls[url]) {
      continue;
    }

    var row = [];
    // Extract data for each header (except google_create_date)
    for (var j = 0; j < headers.length - 1; j++) {
      var fieldName = headers[j];
      var value = item.getChildText(fieldName) || "";
      
      // Parse date fields
      if (fieldName.toLowerCase().includes("date") && value) {
        var date = new Date(value);
        value = isNaN(date.getTime()) ? new Date(0) : date;
      }
      
      row.push(value);
    }
    
    // Add google_create_date
    row.push(currentDate);
    newData.push(row);

    // Mark URL as seen
    if (linkColumnIndex !== -1 && url) {
      existingUrls[url] = true;
    }
  }

  // Append new unique data to sheet (starting from A5 if empty)
  if (newData.length > 0) {
    var startRow = lastRow < 5 ? 5 : lastRow + 1;
    sheet.getRange(startRow, 1, newData.length, headers.length).setValues(newData);
  }

  // Read all data for sorting
  lastRow = sheet.getLastRow();
  var allData = lastRow >= 5 ? sheet.getRange(5, 1, lastRow - 4, headers.length).getValues() : [];

  // Ensure valid Date objects for date columns
  allData = allData.map(row => {
    return row.map((cell, index) => {
      if (headers[index].toLowerCase().includes("date") && !(cell instanceof Date)) {
        var date = new Date(cell);
        return isNaN(date.getTime()) ? new Date(0) : date;
      }
      return cell;
    });
  });

  // Sort by google_create_date (last column) in descending order
  var sortColumnIndex = headers.indexOf("google_create_date");
  allData.sort((a, b) => b[sortColumnIndex] - a[sortColumnIndex]); // Newest first

  // Clear existing data from A5 and write sorted data
  if (lastRow >= 5) {
    sheet.getRange(5, 1, lastRow - 4, headers.length).clearContent();
  }
  if (allData.length > 0) {
    sheet.getRange(5, 1, allData.length, headers.length).setValues(allData);
  }

  // Format date columns
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toLowerCase().includes("date")) {
      sheet.getRange(5, i + 1, allData.length, 1).setNumberFormat("d/m/yyyy");
      
      // Add data validation for calendar picker
      if (allData.length > 0) {
        var range = sheet.getRange(5, i + 1, allData.length, 1);
        var rule = SpreadsheetApp.newDataValidation()
          .requireDate()
          .setAllowInvalid(false)
          .setHelpText("Double-click to pick a date")
          .build();
        range.setDataValidation(rule);
      }
    }
  }
}
