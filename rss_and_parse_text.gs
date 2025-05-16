//rss_and_parse_text.gs : append with google create date, then multiple sort: FIRST by LINK , SECOND by google create date from oldest to latest. Then copy and paste above row content column to itself if LINK column above equal itself, to reduce text parse workload.   
//Then, for all empty cell left in content column, perform regex parse. Finally, sort by google_create_date from latest to oldest, then remove duplicate. (Update old entires with parsing use)





function fetchPolitepolRSS() {
  // RSS feed URL
  var url = "https://politepol.com/fd/8WEimE2bwMgc.xml";
  
  try {
    // Fetch the RSS feed
    var response = UrlFetchApp.fetch(url);
    var xml = response.getContentText();
    
    // Parse the XML content
    var document = XmlService.parse(xml);
    var root = document.getRootElement();
    var channel = root.getChild("channel");
    var items = channel.getChildren("item");
    
    // Get the spreadsheet and Sheet3
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName("Sheet3") || spreadsheet.insertSheet("Sheet3");
    
    // Set headers if not already present
    var headers = ["Title", "Link", "Publication Date", "Description", "Google_date_import", "Content"];
    if (sheet.getRange("A3").getValue() !== "Title") {
      sheet.getRange("A3:F3").setValues([headers]);
    }
    
    // Prepare new data
    var importDate = new Date();
    var maxItems = Math.min(items.length, 100); // Safety cap for RSS items
    var newData = [];
    
    // Extract data from each item
    for (var i = 0; i < maxItems; i++) {
      var item = items[i];
      var title = item.getChildText("title") || "";
      var link = item.getChildText("link") || "";
      var pubDate = item.getChildText("pubDate") || "";
      var description = item.getChildText("description") || "";
      
      // Clean description
      description = description.replace(/<[^>]+>/g, '');
      
      newData.push([title, link, pubDate, description, importDate, ""]);
    }
    
    // Append new data by inserting rows
    if (newData.length > 0) {
      sheet.insertRowsAfter(3, newData.length);
      sheet.getRange(4, 1, newData.length, 6).setValues(newData);
    }
    
    // Get all data including new entries
    var lastRow = sheet.getLastRow();
    if (lastRow < 4) {
      sheet.getRange("A4").setValue("No items found in the feed.");
      return;
    }
    
    var dataRange = sheet.getRange(4, 1, lastRow - 3, 6);
    var data = dataRange.getValues();
    
    // Step 1: Sort by Link (column B) then Google_date_import (column E, oldest to newest)
    data.sort((a, b) => {
      if (a[1] < b[1]) return -1;
      if (a[1] > b[1]) return 1;
      return new Date(a[4]) - new Date(b[4]);
    });
    
    // Update data with sorted values
    dataRange.setValues(data);
    
    // Step 2: Copy Content (column F) if Link (column B) matches the row above
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === data[i-1][1]) {
        data[i][5] = data[i-1][5];
      }
    }
    
    // Log the number of rows with empty Content before fetching
    var emptyContentCount = data.filter(row => row[5] === "" && row[1]).length;
    Logger.log("Number of empty Content cells to fetch: " + emptyContentCount);
    
    // Step 3: Fetch content for empty Content cells (column F)
    var fetchCount = 0; // Counter for processed links
    for (var i = 0; i < data.length; i++) {
      if (data[i][5] === "" && data[i][1]) { // Strict check for empty Content
        fetchCount++;
        try {
          var link = data[i][1];
          var xmlResponse = UrlFetchApp.fetch(link);
          var html = xmlResponse.getContentText();
          
          // Use regex to extract content from <div class="article-grid-content">
          var regex = /<div class="article-grid-content"[^>]*>([\s\S]*?)<\/div>/gi;
          var match = regex.exec(html);
          var content = match ? match[1].replace(/<[^>]+>/g, '').trim() : "No content found";
          
          data[i][5] = content;
          Logger.log("Fetched content for link " + fetchCount + " (Row " + (i + 4) + ", Link: " + link + ")");
        } catch (e) {
          data[i][5] = "Error fetching content: " + e.message;
          Logger.log("Error for link " + fetchCount + " (Row " + (i + 4) + ", Link: " + link + "): " + e.message);
        }
      }
    }
    
    // Update data with content
    dataRange.setValues(data);
    
    // Step 4: Sort by Google_date_import (column E, newest to oldest)
    data.sort((a, b) => new Date(b[4]) - new Date(a[4]));
    
    // Step 5: Remove duplicates based on Link (column B), keeping first occurrence
    var uniqueData = [];
    var seenLinks = new Set();
    
    for (var i = 0; i < data.length; i++) {
      var link = data[i][1];
      if (!seenLinks.has(link)) {
        seenLinks.add(link);
        uniqueData.push(data[i]);
      }
    }
    
    // Clear existing data and write unique data
    sheet.getRange(4, 1, lastRow - 3, 6).clearContent();
    if (uniqueData.length > 0) {
      sheet.getRange(4, 1, uniqueData.length, 6).setValues(uniqueData);
    }
    
    // Log success
    Logger.log("RSS feed processed successfully");
    
  } catch (e) {
    Logger.log("Error: " + e.message);
    sheet.getRange("A4").setValue("Error: " + e.message);
  }
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Politepol RSS')
    .addItem('Fetch RSS Feed', 'fetchPolitepolRSS')
    .addToUi();
}
