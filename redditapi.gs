// redditapi.gs : sort by google create date from latest to oldest , remove duplicate, recursion for non duplicate item until maxattempt (Update old entires use) (multireddit available) 



/**
 * Configuration object for easy modification
 */
/**
 * Configuration object for easy modification
 */
const CONFIG = {
  subreddit: "r/bing", //subreddit: "user/apprehensivead8691/m/multi1",
  timeFilter: "week", // Options: hour, day, week, month, year, all
  limit: 10,         // Number of posts to fetch per API call
  maxAttempts: 5,    // Maximum number of API query attempts
  credentials: {
    clientId: "",           // Replace with your Reddit API client ID
    clientSecret: "",   // Replace with your Reddit API client secret
    username: "",     // Replace with your Reddit username
    password: ""      // Replace with your Reddit password
  },
  sheetName: "bing",
  startCell: "A4", // Starting cell for data append
  userAgent: "GoogleSheetsRedditScript/1.0 (by /u/YOUR_REDDIT_USERNAME)" // Replace with a unique User-Agent
};


/**
 * Main function to fetch and process Reddit posts
 */
function fetchRedditTopPosts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName);
  if (!sheet) {
    Logger.log(`Sheet not found: ${CONFIG.sheetName}`);
    return;
  }

  // Step 1: Get OAuth access token
  const token = getAccessToken();
  if (!token) {
    sheet.getRange("A1").setValue("Authentication failed. Check logs.");
    return;
  }

  let attempt = 0;
  let after = "";
  let hasNewEntries = false;

  while (attempt < CONFIG.maxAttempts && !hasNewEntries) {
    attempt++;
    Logger.log(`Attempt ${attempt} with after=${after || "none"}`);

    // Fetch posts from Reddit
    const posts = fetchPostsFromReddit(token, after);
    if (!posts || posts.length === 0) {
      Logger.log(`No posts retrieved in attempt ${attempt}`);
      break;
    }

    // Process posts into rows
    const newRows = processPosts(posts);
    Logger.log(`Processed ${newRows.length} new rows`);

    // Get existing rows and combine with new rows
    const allRows = getExistingRows(sheet).concat(newRows);

    // Sort by google_import_datetime (column 9, index 8)
    const sortedRows = sortRowsByImportDate(allRows);
    Logger.log(`Sorted ${sortedRows.length} total rows`);

    // Remove duplicates based on Post Link (column 8, index 7)
    const uniqueRows = removeDuplicates(sortedRows);
    Logger.log(`After deduplication: ${uniqueRows.length} unique rows`);

    // Check if new unique entries were added
    const existingLinks = new Set(getExistingRows(sheet).map(row => row[7]));
    const newUniqueRows = uniqueRows.filter(row => !existingLinks.has(row[7]));

    if (newUniqueRows.length > 0) {
      // Append only new unique rows
      appendRowsToSheet(sheet, uniqueRows);
      hasNewEntries = true;
      Logger.log(`Appended ${newUniqueRows.length} new unique posts in attempt ${attempt}`);
    } else {
      Logger.log(`No new unique posts in attempt ${attempt}`);
      after = posts[posts.length - 1].data.name; // Update 'after' for next query
    }
  }

  if (!hasNewEntries) {
    Logger.log(`All attempts exhausted. No new unique posts found after ${CONFIG.maxAttempts} attempts.`);
    sheet.getRange("A1").setValue(`No new unique posts after ${CONFIG.maxAttempts} attempts.`);
  } else {
    sheet.getRange("A1").setValue(`Last updated: ${new Date().toISOString()}`);
  }
}

/**
 * Get OAuth access token from Reddit
 * @returns {string|null} Access token or null if failed
 */
function getAccessToken() {
  const authUrl = "https://www.reddit.com/api/v1/access_token";
  const authOptions = {
    method: "post",
    headers: {
      "Authorization": "Basic " + Utilities.base64Encode(`${CONFIG.credentials.clientId}:${CONFIG.credentials.clientSecret}`),
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": CONFIG.userAgent
    },
    payload: {
      "grant_type": "password",
      "username": CONFIG.credentials.username,
      "password": CONFIG.credentials.password
    },
    muteHttpExceptions: true
  };

  try {
    const authResponse = UrlFetchApp.fetch(authUrl, authOptions);
    const authStatus = authResponse.getResponseCode();
    if (authStatus !== 200) {
      Logger.log(`Authentication failed. Status: ${authStatus}, Response: ${authResponse.getContentText()}`);
      return null;
    }
    const token = JSON.parse(authResponse.getContentText()).access_token;
    Logger.log("Access token obtained successfully.");
    return token;
  } catch (e) {
    Logger.log(`Error obtaining access token: ${e}`);
    return null;
  }
}

/**
 * Fetch posts from Reddit API
 * @param {string} token - OAuth access token
 * @param {string} after - Pagination parameter for Reddit API
 * @returns {Array|null} Array of post objects or null if failed
 */
function fetchPostsFromReddit(token, after) {
  let apiUrl = `https://oauth.reddit.com/${CONFIG.subreddit}/top?t=${CONFIG.timeFilter}&limit=${CONFIG.limit}`;
  if (after) {
    apiUrl += `&after=${after}`;
  }

  const options = {
    method: "get",
    headers: {
      "Authorization": `Bearer ${token}`,
      "User-Agent": CONFIG.userAgent
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseStatus = response.getResponseCode();
    if (responseStatus !== 200) {
      Logger.log(`API request failed. Status: ${responseStatus}, URL: ${apiUrl}, Response: ${response.getContentText()}`);
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName)
        .getRange("A1").setValue("API request failed. Check logs.");
      return null;
    }

    const data = JSON.parse(response.getContentText());
    Logger.log(`API request successful. Fetched ${data.data.children.length} posts.`);
    return data.data.children;
  } catch (e) {
    Logger.log(`Error fetching posts: ${e}`);
    return null;
  }
}

/**
 * Process fetched posts into row data
 * @param {Array} posts - Array of post objects from Reddit
 * @returns {Array} Array of processed row data
 */
function processPosts(posts) {
  const currentTime = new Date().toISOString();
  return posts.map(post => {
    const postData = post.data;
    return [
      CONFIG.subreddit,
      postData.title,
      postData.author,
      postData.score,
      postData.url,
      new Date(postData.created_utc * 1000).toISOString(),
      postData.selftext || "",
      `https://www.reddit.com${postData.permalink}`,
      currentTime
    ];
  });
}

/**
 * Get existing rows from the sheet
 * @param {Sheet} sheet - Google Sheet object
 * @returns {Array} Array of existing rows
 */
function getExistingRows(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 4) {
    return [];
  }
  const range = sheet.getRange(`A4:I${lastRow}`);
  return range.getValues();
}

/**
 * Sort rows by google_import_datetime (column 9, index 8) from latest to oldest
 * @param {Array} rows - Rows to sort
 * @returns {Array} Sorted array of rows
 */
function sortRowsByImportDate(rows) {
  return rows.sort((a, b) => {
    const dateA = new Date(a[8]);
    const dateB = new Date(b[8]);
    return dateB - dateA; // Latest first
  });
}

/**
 * Remove duplicates based on Post Link (column 8, index 7)
 * @param {Array} sortedRows - Sorted rows to check for duplicates
 * @returns {Array} Array of unique rows
 */
function removeDuplicates(sortedRows) {
  const uniqueLinks = new Set();
  const uniqueRows = [];

  for (const row of sortedRows) {
    const postLink = row[7]; // Post Link in column 8
    if (!uniqueLinks.has(postLink)) {
      uniqueLinks.add(postLink);
      uniqueRows.push(row);
    }
  }

  return uniqueRows;
}

/**
 * Append unique rows to the sheet, preserving existing data
 * @param {Sheet} sheet - Google Sheet object
 * @param {Array} rows - Array of rows to append
 */
function appendRowsToSheet(sheet, rows) {
  if (rows.length === 0) {
    Logger.log("No rows to append.");
    return;
  }

  // Validate rows structure
  const expectedColumns = 9;
  const isValid = rows.every(row => Array.isArray(row) && row.length === expectedColumns);
  if (!isValid) {
    Logger.log(`Invalid rows structure: ${JSON.stringify(rows)}`);
    sheet.getRange("A1").setValue("Error: Invalid data structure. Check logs.");
    return;
  }

  // Set headers if sheet is empty
  const lastRow = sheet.getLastRow();
  if (lastRow < 3) {
    sheet.getRange("A3:I3").setValues([[
      "Subreddit", "Title", "Author", "Score", "URL", 
      "Created (UTC)", "Content", "Post Link", "google_import_datetime"
    ]]);
  }

  // Write all rows (existing + new, sorted, deduplicated)
  try {
    const targetRange = sheet.getRange(`A4:I${3 + rows.length}`);
    if (targetRange.getNumColumns() !== expectedColumns) {
      Logger.log(`Range column mismatch. Expected ${expectedColumns}, got ${targetRange.getNumColumns()}`);
      sheet.getRange("A1").setValue("Error: Range column mismatch. Check logs.");
      return;
    }
    targetRange.setValues(rows);
    Logger.log(`Successfully wrote ${rows.length} rows.`);
  } catch (e) {
    Logger.log(`Error appending rows: ${e}`);
    sheet.getRange("A1").setValue("Error appending data. Check logs.");
  }
}
