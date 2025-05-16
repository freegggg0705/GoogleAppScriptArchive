//  multiredditapi.gs: multireddit by default, yellow line split, no sort and de-duplicate (Append use only)




/**
 * Tests access to the Control sheet and the specified sheet.
 */
function testSheetAccess() {
  // Get the Control sheet
  var controlSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Control");
  Logger.log("Control sheet exists: " + !!controlSheet);
  if (!controlSheet) {
    Logger.log("Error: Control sheet not found.");
    SpreadsheetApp.getUi().alert("Error", "Control sheet not found. Please create a sheet named 'Control'.", SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // Retrieve timeFilter and sheetName from Control sheet
  var timeFilter = controlSheet.getRange("A4").getValue();
  var sheetName = controlSheet.getRange("A5").getValue() || "Sheet4"; // Fallback to "Sheet4" if A5 is empty

  // Log the values for debugging
  Logger.log("timeFilter: " + timeFilter + ", type: " + typeof timeFilter);
  Logger.log("sheetName: " + sheetName + ", type: " + typeof sheetName);

  // Validate timeFilter
  var validTimeFilters = ["hour", "day", "week", "month", "year", "all"];
  if (!timeFilter || typeof timeFilter !== "string" || !validTimeFilters.includes(timeFilter.toLowerCase())) {
    Logger.log("Error: Invalid time filter. Value: " + timeFilter + ". Must be one of: " + validTimeFilters.join(", "));
    SpreadsheetApp.getUi().alert("Error", "Invalid time filter in A4. Please use one of: " + validTimeFilters.join(", "), SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // Validate sheetName
  if (!sheetName || typeof sheetName !== "string" || sheetName.trim() === "") {
    Logger.log("Error: Sheet name is empty or invalid. Using fallback: Sheet4");
    SpreadsheetApp.getUi().alert("Error", "Sheet name in A5 is empty or invalid. Using fallback: Sheet4", SpreadsheetApp.getUi().ButtonSet.OK);
    sheetName = "Sheet4"; // Ensure fallback is applied
  }

  // Test access to the specified sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    Logger.log("Error: Sheet '" + sheetName + "' not found.");
    SpreadsheetApp.getUi().alert("Error", "Sheet '" + sheetName + "' does not exist. Please create the sheet or update A5.", SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  Logger.log("Sheet found: " + sheetName);
  Logger.log("Test completed successfully.");
}

/**
 * Runs the process to fetch Reddit top posts based on settings in the Control sheet.
 */
function runGetRedditTopPosts() {
  // Get the Control sheet
  var controlSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Control");
  Logger.log("Control sheet exists: " + !!controlSheet);
  if (!controlSheet) {
    Logger.log("Error: Control sheet not found.");
    SpreadsheetApp.getUi().alert("Error", "Control sheet not found. Please create a sheet named 'Control'.", SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // Retrieve timeFilter and sheetName
  var timeFilter = controlSheet.getRange("A4").getValue();
  var sheetName = controlSheet.getRange("A5").getValue() || "Sheet4"; // Fallback to "Sheet4" if A5 is empty
  Logger.log("Raw timeFilter: " + timeFilter + ", type: " + typeof timeFilter);
  Logger.log("Raw sheetName: " + sheetName + ", type: " + typeof sheetName);

  // Validate timeFilter
  var validTimeFilters = ["hour", "day", "week", "month", "year", "all"];
  if (!timeFilter || typeof timeFilter !== "string" || !validTimeFilters.includes(timeFilter.toLowerCase())) {
    Logger.log("Error: Invalid time filter. Value: " + timeFilter + ". Must be one of: " + validTimeFilters.join(", "));
    SpreadsheetApp.getUi().alert("Error", "Invalid time filter in A4. Please use one of: " + validTimeFilters.join(", "), SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // Validate sheetName
  if (!sheetName || typeof sheetName !== "string" || sheetName.trim() === "") {
    Logger.log("Error: Sheet name is empty or invalid. Using fallback: Sheet4");
    SpreadsheetApp.getUi().alert("Error", "Sheet name in A5 is empty or invalid. Using fallback: Sheet4", SpreadsheetApp.getUi().ButtonSet.OK);
    sheetName = "Sheet4";
  }

  // Check if the sheet exists
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    Logger.log("Error: Sheet '" + sheetName + "' not found.");
    SpreadsheetApp.getUi().alert("Error", "Sheet '" + sheetName + "' does not exist. Please create the sheet or update A5.", SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // Call getRedditTopPosts
  Logger.log("Calling getRedditTopPosts with timeFilter: " + timeFilter.toLowerCase() + ", sheetName: " + sheetName);
  getRedditTopPosts(timeFilter.toLowerCase(), sheetName);
}

/**
 * Fetches top Reddit posts and writes them to the specified sheet.
 * @param {string} timeFilter - The time filter for Reddit posts (e.g., "hour", "day", "week", "month", "year", "all").
 * @param {string} sheetName - The name of the sheet to write the data to.
 */
function getRedditTopPosts(timeFilter, sheetName) {
  // Safeguard against undefined or invalid parameters
  if (!timeFilter || !sheetName || typeof timeFilter !== "string" || typeof sheetName !== "string") {
    var errorMsg = "Error: Invalid parameters - timeFilter: " + timeFilter + ", sheetName: " + sheetName;
    Logger.log(errorMsg);
    SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange("A1").setValue(errorMsg);
    return;
  }

  // Configuration - Replace these with your details or move to Control sheet
  var subreddit = "user/apprehensivead8691/m/multi1"; // Multireddit path
  var clientId = ""; // Add your client ID
  var clientSecret = ""; // Add your client secret
  var username = ""; // Add your Reddit username
  var password = ""; // Add your Reddit password

  // Validate Reddit API credentials
  if (!clientId || !clientSecret || !username || !password) {
    var errorMsg = "Error: Reddit API credentials are missing.";
    Logger.log(errorMsg);
    SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange("A1").setValue(errorMsg);
    return;
  }

  Logger.log("getRedditTopPosts - Starting with timeFilter: " + timeFilter + ", sheetName: " + sheetName);

  // Validate timeFilter
  var validTimeFilters = ["hour", "day", "week", "month", "year", "all"];
  if (!validTimeFilters.includes(timeFilter)) {
    var errorMsg = "Error: Invalid timeFilter: " + timeFilter + ". Must be one of: " + validTimeFilters.join(", ");
    Logger.log(errorMsg);
    SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange("A1").setValue(errorMsg);
    return;
  }

  // Step 1: Get OAuth access token
  var authUrl = "https://www.reddit.com/api/v1/access_token";
  var authOptions = {
    method: "post",
    headers: {
      "Authorization": "Basic " + Utilities.base64Encode(clientId + ":" + clientSecret),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    payload: {
      "grant_type": "password",
      "username": username,
      "password": password
    },
    muteHttpExceptions: true
  };

  var authResponse = UrlFetchApp.fetch(authUrl, authOptions);
  var authStatus = authResponse.getResponseCode();
  if (authStatus !== 200) {
    var errorMsg = "Authentication failed. Status: " + authStatus + ", Response: " + authResponse.getContentText();
    Logger.log(errorMsg);
    SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange("A1").setValue(errorMsg);
    return;
  }
  var token = JSON.parse(authResponse.getContentText()).access_token;
  Logger.log("Access token obtained successfully.");

  // Step 2: Fetch top posts with dynamic time filter
  var apiUrl = "https://oauth.reddit.com/" + subreddit + "/top?t=" + timeFilter + "&limit=20";
  Logger.log("Fetching posts from: " + apiUrl);
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
    var errorMsg = "API request failed. Status: " + responseStatus + ", URL: " + apiUrl + ", Response: " + response.getContentText();
    Logger.log(errorMsg);
    SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange("A1").setValue(errorMsg);
    return;
  }
  var data = JSON.parse(response.getContentText());
  Logger.log("API request successful. Fetched " + data.data.children.length + " posts.");

  // Step 3: Prepare data
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    var errorMsg = "Sheet '" + sheetName + "' not found.";
    Logger.log(errorMsg);
    SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange("A1").setValue(errorMsg);
    return;
  }

  // Handle empty post list
  var posts = data.data.children;
  if (posts.length === 0) {
    Logger.log("No posts found for time filter: " + timeFilter);
    sheet.getRange(2, 1).setValue("No posts found for time filter: " + timeFilter);
    return;
  }

  // Collect data into variable
  var headers = [["Title", "Author", "Score", "URL", "Created (UTC)", "Content", "Post Link"]];
  var rows = [];
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i].data;
    rows.push([
      post.title,
      post.author,
      post.score,
      post.url,
      new Date(post.created_utc * 1000).toISOString(),
      post.selftext || "",
      "https://www.reddit.com" + post.permalink
    ]);
  }
  var output = headers.concat(rows);

  // Calculate total rows needed: date row + data rows + 1 yellow separator row
  var totalRows = 1 + output.length + 1; // 1 date + headers + posts + 1 yellow

  // Step 4: Insert exact number of rows at the top
  sheet.insertRowsBefore(1, totalRows);

  // Step 5: Write date, data, and format yellow separator
  // Write current date and time in A1
  var now = new Date();
  sheet.getRange(1, 1).setValue(now.toISOString().replace("T", " ").slice(0, 19));

  // Write data (headers and posts, starting at row 2)
  sheet.getRange(2, 1, output.length, output[0].length).setValues(output);

  // Clear any existing yellow background in the data range to prevent double yellow
  sheet.getRange(1, 1, totalRows, 9).setBackground(null);

  // Yellow separator row at bottom (row after data, e.g., A8:I8 for 5 posts)
  sheet.getRange(totalRows, 1, 1, 9).setBackground("#FFFF00");

  // Set column widths for readability
  sheet.setColumnWidths(1, 7, 150); // Columns A to G (Title to Post Link)
  sheet.setColumnWidths(8, 2, 50); // Columns H to I (extra space)

  Logger.log("Inserted " + totalRows + " rows with date, data, and yellow separator at bottom in sheet: " + sheetName);
}
