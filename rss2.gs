// Preset column amount, sort by third column, and de-duplicate by second column, no google create date ( For append use )

function appendFeedSortDedupegoogle12345678() {
  // Get the spreadsheet and target sheet
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName("SHEET8");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: SHEET8 not found.");
    return;
  }

  // URL of the RSS feed
  var feedUrl = "https://news.google.com/rss/search?q=site:https%3A%2F%2Fhk.news.yahoo.com+inurl:yahoo-%E6%97%A9%E5%A0%B1&hl=zh-HK&gl=HK&sort=date";

  try {
    // Fetch and parse the RSS feed
    var response = UrlFetchApp.fetch(feedUrl);
    var xml = response.getContentText();
    var document = XmlService.parse(xml);
    var root = document.getRootElement();
    var channel = root.getChild("channel");
    var items = channel.getChildren("item");

    // Prepare data array
    var data = [];
    var headers = ["Title", "Link", "PubDate", "Description"];
    
    // Collect feed items
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var title = item.getChildText("title") || "";
      var link = item.getChildText("link") || "";
      var pubDate = item.getChildText("pubDate") || "";
      var description = item.getChildText("description") || "";
      
      data.push([title, link, pubDate, description]);
    }

    // Sort data by PubDate (oldest to newest)
    data.sort(function(a, b) {
      var dateA = new Date(a[2]); // PubDate is in column 3 (index 2)
      var dateB = new Date(b[2]);
      return dateA - dateB; // Ascending order (oldest first)
    });

    // Remove duplicates based on Link (column B, index 1)
    var uniqueData = [];
    var seenLinks = new Set();
    for (var i = 0; i < data.length; i++) {
      var link = data[i][1];
      if (!seenLinks.has(link) && link !== "") {
        seenLinks.add(link);
        uniqueData.push(data[i]);
      }
    }

    // Clear existing content starting from A4, but only if there are rows to clear
    var lastRow = sheet.getLastRow();
    if (lastRow >= 4) {
      sheet.getRange("A4:D" + lastRow).clearContent();
    }

    // Append headers if not already present
    if (sheet.getRange("A3").getValue() !== "Title") {
      sheet.getRange("A3:D3").setValues([headers]);
    }

    // Append unique data starting from A4
    if (uniqueData.length > 0) {
      sheet.getRange("A4:D" + (4 + uniqueData.length - 1)).setValues(uniqueData);
    } else {
      SpreadsheetApp.getUi().alert("No unique data after deduplication.");
      return;
    }

  } catch (e) {
    SpreadsheetApp.getUi().alert("Error: " + e.message);
  }
}
