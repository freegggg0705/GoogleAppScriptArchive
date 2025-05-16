// redditapi2.gs : aggregate multiple subreddit parse, just stack no sort and de-duplication, yellow line to split every retrieval, list can have only 1 item (Append use) 


function runGetRedditTopPosts() {
  var controlSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Control");
  var timeFilter = controlSheet.getRange("A1").getValue();
  // Use dynamic sheet name from A2 or fallback to a default
  var sheetName = controlSheet.getRange("A2").getValue() || "Sheet4"; // Fallback to "Sheet4" if A2 is empty
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  // Validate sheetName and sheet existence
  if (!sheetName) {
    SpreadsheetApp.getUi().alert("Error", "Sheet name is empty. Please enter a valid sheet name in cell A2.", SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error", "Sheet '" + sheetName + "' does not exist. Please enter a valid sheet name.", SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  Logger.log("Calling getRedditTopPosts with sheetName: " + sheetName); // Debug log
  getRedditTopPosts(timeFilter, sheetName);
}

function getRedditTopPosts(timeFilter, sheetName) {
  Logger.log("Received sheetName: " + sheetName ); // Debug log
  // Configuration - Replace these with your details
  var config = {
    subreddits: ["stablediffusion", "chatgpt", "localllama", "googlegeminiai", "claudeai", "chatgptcoding"],
    clientId: "",
    clientSecret: "",
    username: "",
    password: "",
    postLimit: 10 // Posts per subreddit
  };

  // Step 1: Get OAuth access token
  var authUrl = "https://www.reddit.com/api/v1/access_token";
  var authOptions = {
    method: "post",
    headers: {
      "Authorization": "Basic " + Utilities.base64Encode(config.clientId + ":" + config.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    payload: {
      "grant_type": "password",
      "username": config.username,
      "password": config.password
    },
    muteHttpExceptions: true
  };

  var authResponse = UrlFetchApp.fetch(authUrl, authOptions);
  var authStatus = authResponse.getResponseCode();
  if (authStatus !== 200) {
    Logger.log("Authentication failed. Status: " + authStatus + ", Response: " + authResponse.getContentText());
    SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange("A1").setValue("Authentication failed. Check logs.");
    return;
  }
  var token = JSON.parse(authResponse.getContentText()).access_token;
  Logger.log("Access token obtained successfully.");

  // Step 2: Prepare sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    Logger.log("Sheet '" + sheetName + "' not found.");
    SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange("A1").setValue("Sheet '" + sheetName + "' not found.");
    return;
  }

  // Step 3: Fetch and prepare data for each subreddit
  var allOutput = [];
  var totalRows = 1; // Start with 1 for timestamp

  for (var s = 0; s < config.subreddits.length; s++) {
    var subreddit = config.subreddits[s];

    // Fetch top posts for the specified time period
    var apiUrl = "https://oauth.reddit.com/r/" + subreddit + "/top?t=" + timeFilter + "&limit=" + config.postLimit;
    var options = {
      method: "get",
      headers: {
        "Authorization": "Bearer " + token,
        "User-Agent": "GoogleSheetsRedditScript/1.0"
      },
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(apiUrl, options);
    var responseStatus = response.getResponseCode();
    if (responseStatus !== 200) {
      Logger.log("API request failed for r/" + subreddit + ". Status: " + responseStatus + ", Response: " + response.getContentText());
      sheet.getRange("A1").setValue("API request failed for r/" + subreddit + ". Check logs.");
      continue; // Skip to next subreddit
    }
    var data = JSON.parse(response.getContentText());
    Logger.log("Fetched " + data.data.children.length + " posts from r/" + subreddit);

    // Prepare data for this subreddit
    var headers = [["Subreddit", "Title", "Author", "Score", "URL", "Created (UTC)", "Content", "Post Link"]];
    var rows = [];
    var posts = data.data.children;
    for (var i = 0; i < posts.length; i++) {
      var post = posts[i].data;
      rows.push([
        subreddit,
        post.title,
        post.author,
        post.score,
        post.url,
        new Date(post.created_utc * 1000).toISOString(),
        post.selftext || "",
        "https://www.reddit.com" + post.permalink
      ]);
    }

    // Combine subreddit header, data headers, and posts
    var subredditSection = [];
    subredditSection.push(["Subreddit: " + subreddit]); // Subreddit title row (1 column)
    subredditSection = subredditSection.concat(headers.concat(rows));
    allOutput = allOutput.concat(subredditSection);

    // Add rows for this section: subreddit title + headers + posts
    totalRows += 1 + headers.length + rows.length;
  }

  // Add 1 row for the final yellow separator
  totalRows += 1;

  // Step 4: Insert all rows at the top
  if (allOutput.length === 0) {
    Logger.log("No data fetched from any subreddit.");
    sheet.getRange("A1").setValue("No data fetched. Check logs.");
    return;
  }
  sheet.insertRowsBefore(1, totalRows);

  // Step 5: Write timestamp, data, and format yellow separator
  // Write timestamp at the top
  var now = new Date();
  sheet.getRange(1, 1).setValue(now.toISOString().replace("T", " ").slice(0, 19));

  // Write data for each subreddit section
  var currentRow = 2;
  for (var s = 0; s < config.subreddits.length; s++) {
    var subreddit = config.subreddits[s];
    var sectionRows = allOutput.filter(row => row[0].startsWith("Subreddit: " + subreddit) || row[0] === subreddit || row[0] === "Subreddit");
    if (sectionRows.length === 0) continue;

    // Write subreddit title row (1 column)
    sheet.getRange(currentRow, 1).setValue("Subreddit: " + subreddit);
    currentRow++;

    // Write headers (8 columns)
    var headers = [["Subreddit", "Title", "Author", "Score", "URL", "Created (UTC)", "Content", "Post Link"]];
    sheet.getRange(currentRow, 1, 1, 8).setValues(headers);
    currentRow++;

    // Write posts (8 columns)
    var dataRows = sectionRows.slice(1).filter(row => row[0] === subreddit); // Only post rows for this subreddit
    if (dataRows.length > 0) {
      sheet.getRange(currentRow, 1, dataRows.length, 8).setValues(dataRows);
      currentRow += dataRows.length;
    }
  }

  // Yellow separator row at the very end
  sheet.getRange(totalRows, 1, 1, 9).setBackground("#FFFF00");

  // Clear any stray yellow backgrounds above the final separator
  sheet.getRange(1, 1, totalRows - 1, 9).setBackground(null);

  // Set column widths for readability
  sheet.setColumnWidths(1, 8, 150); // Columns A to H (Subreddit to Post Link)
  sheet.setColumnWidths(9, 1, 50); // Column I (extra space)

  Logger.log("Inserted " + totalRows + " rows with timestamp, subreddit sections, and final yellow separator.");
}
