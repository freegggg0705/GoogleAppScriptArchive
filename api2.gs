//api2.gs With authentication,with endpoint params config, with google create date, sort by google create date, remove duplicate (Update old entires use with Oauth and endpoints param)

function scrapeNewsBlurRiverStories() {
  // Step 1: Authenticate with NewsBlur API
  var loginUrl = 'https://www.newsblur.com/api/login';
  var loginPayload = {
    'username': 'freegggg0705@gmail.com', // Replace with your NewsBlur username
    'password': '9qtdrmkp'  // Replace with your NewsBlur password
  };

  var loginOptions = {
    'method': 'post',
    'payload': loginPayload,
    'muteHttpExceptions': true
  };

  // Make the login request
  var loginResponse = UrlFetchApp.fetch(loginUrl, loginOptions);
  var loginHeaders = loginResponse.getAllHeaders();
  var sessionCookie = null;

  // Log headers for debugging
  Logger.log('Login Response Headers: ' + JSON.stringify(loginHeaders));

  // Handle case-insensitive header names
  var headersLowerCase = {};
  for (var key in loginHeaders) {
    headersLowerCase[key.toLowerCase()] = loginHeaders[key];
  }

  // Extract the session cookie from the 'Set-Cookie' header (case-insensitive)
  if (headersLowerCase['set-cookie']) {
    var cookies = headersLowerCase['set-cookie'];
    Logger.log('Set-Cookie Header: ' + JSON.stringify(cookies));
    
    // Handle both array and string cases
    if (Array.isArray(cookies)) {
      cookies.forEach(function(cookie) {
        if (cookie.includes('newsblur_sessionid')) {
          sessionCookie = cookie.split(';')[0]; // e.g., newsblur_sessionid=xyz123
        }
      });
    } else if (typeof cookies === 'string' && cookies.includes('newsblur_sessionid')) {
      sessionCookie = cookies.split(';')[0];
    }
  } else {
    Logger.log('No Set-Cookie header found in response');
  }

  // Log the extracted cookie
  Logger.log('Extracted Session Cookie: ' + sessionCookie);

  // Check authentication status
  var loginData = JSON.parse(loginResponse.getContentText());
  if (loginData.authenticated !== true) {
    Logger.log('Authentication failed: ' + JSON.stringify(loginData));
    return;
  }

  // If no session cookie, log error and stop
  if (!sessionCookie) {
    Logger.log('Error: No session cookie extracted. Cannot proceed with API request.');
    return;
  }

  // Step 2: Configure and fetch stories
  var fetchConfig = {
    endpoint: 'https://www.newsblur.com/reader/starred_stories',
    method: 'get',
    params: {
      'page': '1'
    },
    headers: {
      'Cookie': sessionCookie
    }
  };

  // Build URL with query parameters
  var queryString = Object.keys(fetchConfig.params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(fetchConfig.params[key]))
    .join('&');
  var storiesUrl = fetchConfig.endpoint + (queryString ? '?' + queryString : '');

  var fetchOptions = {
    'method': fetchConfig.method,
    'headers': fetchConfig.headers,
    'muteHttpExceptions': true
  };

  // Make the GET request
  var response = UrlFetchApp.fetch(storiesUrl, fetchOptions);
  var responseCode = response.getResponseCode();
  var responseText = response.getContentText();

  // Step 3: Handle the response
  if (responseCode === 200) {
    var data = JSON.parse(responseText);
    var stories = data.stories || [];

    // Log or process the stories
    Logger.log('Found ' + stories.length + ' stories');
    stories.forEach(function(story) {
      Logger.log('Story: ' + (story.story_title || 'N/A') + ' (Feed ID: ' + (story.story_feed_id || 'N/A') + ')');
    });

    // Write to a Google Sheet
    writeToSheet(stories);
  } else {
    Logger.log('Error fetching stories: ' + responseCode + ' - ' + responseText);
    return;
  }
}

// Function to write stories to a Google Sheet
function writeToSheet(stories) {
  var sheetConfig = {
    sheetName: 'Sheet7',
    startCell: 'A4',
    uniqueKey: 'story_hash',
    sortColumn: 'google_create_date'
  };

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetConfig.sheetName) || spreadsheet.insertSheet(sheetConfig.sheetName);
  
  // Get existing data
  var lastRow = sheet.getLastRow();
  var existingData = lastRow >= 4 ? sheet.getRange(sheetConfig.startCell + ':' + sheet.getLastColumn() + lastRow).getValues() : [];
  var headers = existingData.length > 0 ? existingData[0] : null;

  // Add google_create_date to new stories
  var currentDate = new Date().toISOString();
  stories.forEach(function(story) {
    story.google_create_date = currentDate;
  });

  // Collect all unique keys from stories
  var allKeys = new Set(['google_create_date']);
  stories.forEach(function(story) {
    Object.keys(story).forEach(function(key) {
      allKeys.add(key);
    });
  });

  // Use existing headers if available, otherwise create new ones
  if (!headers) {
    headers = Array.from(allKeys);
    sheet.getRange(4, 1, 1, headers.length).setValues([headers]);
  } else {
    // Ensure all new keys are in headers
    allKeys.forEach(function(key) {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    });
    sheet.getRange(4, 1, 1, headers.length).setValues([headers]);
  }

  // Combine existing and new data
  var allData = existingData.slice(1); // Skip headers
  stories.forEach(function(story) {
    var row = headers.map(function(key) {
      if (story[key] && typeof story[key] === 'object') {
        return JSON.stringify(story[key]);
      }
      return story[key] != null ? String(story[key]) : 'N/A';
    });
    allData.push(row);
  });

  // Remove duplicates based on uniqueKey
  var uniqueData = [];
  var seenKeys = new Set();
  allData.forEach(function(row) {
    var keyIndex = headers.indexOf(sheetConfig.uniqueKey);
    var keyValue = keyIndex !== -1 ? row[keyIndex] : null;
    if (keyValue && !seenKeys.has(keyValue)) {
      seenKeys.add(keyValue);
      uniqueData.push(row);
    }
  });

  // Sort by google_create_date
  var dateIndex = headers.indexOf(sheetConfig.sortColumn);
  if (dateIndex !== -1) {
    uniqueData.sort(function(a, b) {
      return new Date(a[dateIndex]) - new Date(b[dateIndex]);
    });
  }

  // Write data to sheet
  if (uniqueData.length > 0) {
    sheet.getRange(5, 1, uniqueData.length, headers.length).setValues(uniqueData);
  } else {
    Logger.log('No unique stories to write to sheet');
  }
}
