//newsblurAPIfetch.gs : fetch articles text by newsblur api upon article hash by gonna need decoding process line by line for chinese (For fetch articles saved in newsblur use)


function scrapeNewsBlurOriginalStory() {
  // Configuration
  const CONFIG = {
    sheetName: 'Sheet3',
    storyHashColumn: 'A',
    outputStartColumn: 'B',
    startRow: 4,
    apiDelayMs: 2000 // 2 seconds delay between requests
  };

  // Step 1: Authenticate with NewsBlur API
  var loginUrl = 'https://www.newsblur.com/api/login';
  var loginPayload = {
    'username': '', // Replace with your NewsBlur username
    'password': ''  // Replace with your NewsBlur password
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

  // Handle case-insensitive header names
  var headersLowerCase = {};
  for (var key in loginHeaders) {
    headersLowerCase[key.toLowerCase()] = loginHeaders[key];
  }

  // Extract the session cookie
  if (headersLowerCase['set-cookie']) {
    var cookies = headersLowerCase['set-cookie'];
    if (Array.isArray(cookies)) {
      cookies.forEach(function(cookie) {
        if (cookie.includes('newsblur_sessionid')) {
          sessionCookie = cookie.split(';')[0];
        }
      });
    } else if (typeof cookies === 'string' && cookies.includes('newsblur_sessionid')) {
      sessionCookie = cookies.split(';')[0];
    }
  }

  if (!sessionCookie) {
    Logger.log('Error: No session cookie extracted');
    return;
  }

  // Check authentication status
  var loginData;
  try {
    loginData = JSON.parse(loginResponse.getContentText());
  } catch (e) {
    Logger.log('Error parsing login response: ' + e);
    return;
  }

  if (loginData.authenticated !== true) {
    Logger.log('Authentication failed: ' + JSON.stringify(loginData));
    return;
  }

  // Step 2: Get story hashes from spreadsheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.startRow) {
    Logger.log('No story hashes found in ' + CONFIG.sheetName);
    return;
  }

  var storyHashes = sheet.getRange(CONFIG.storyHashColumn + CONFIG.startRow + ':' + CONFIG.storyHashColumn + lastRow).getValues();
  var outputCheck = sheet.getRange(CONFIG.outputStartColumn + CONFIG.startRow + ':' + CONFIG.outputStartColumn + lastRow).getValues();

  // Step 3: Process each story hash where output is empty
  var results = [];
  for (var i = 0; i < storyHashes.length; i++) {
    if (storyHashes[i][0] && !outputCheck[i][0]) { // Has story hash and no output
      var storyHash = storyHashes[i][0];
      var storyUrl = 'https://www.newsblur.com/rss_feeds/original_text?story_hash=' + encodeURIComponent(storyHash);
      var fetchOptions = {
        'method': 'get',
        'headers': {
          'Cookie': sessionCookie
        },
        'muteHttpExceptions': true
      };

      // Make the GET request
      var response = UrlFetchApp.fetch(storyUrl, fetchOptions);
      var responseCode = response.getResponseCode();
      var responseText = response.getContentText();

      if (responseCode === 200) {
        try {
          // Log raw response text
          Logger.log('Raw responseText for hash ' + storyHash + ': ' + responseText.substring(0, 500));
          var jsonResponse = JSON.parse(responseText);
          // Log parsed original_text
          if (jsonResponse.original_text) {
            Logger.log('Parsed original_text for hash ' + storyHash + ': ' + jsonResponse.original_text.substring(0, 500));
          }
          // Add raw JSON and story hash to result
          jsonResponse.story_hash = storyHash;
          jsonResponse.response_code = responseCode;
          jsonResponse.raw_json = responseText; // Store raw JSON as text
          results.push(jsonResponse);
          Logger.log('Fetched data for story hash: ' + storyHash);
        } catch (e) {
          Logger.log('Error parsing response for hash ' + storyHash + ': ' + e);
          results.push({
            story_hash: storyHash,
            response_code: responseCode,
            raw_json: responseText,
            error: 'Parse error: ' + e.message
          });
        }
      } else {
        Logger.log('Error fetching story for hash ' + storyHash + ': ' + responseCode);
        results.push({
          story_hash: storyHash,
          response_code: responseCode,
          error: responseText
        });
      }

      // Add delay between requests
      Utilities.sleep(CONFIG.apiDelayMs);
    }
  }

  // Step 4: Write results to sheet and process raw_json
  if (results.length > 0) {
    writeToSheet(results, sheet, CONFIG);
  } else {
    Logger.log('No new story hashes to process or all output cells filled');
  }
}

// Function to extract and decode original_text from raw JSON
function processRawJson(jsonString) {
  try {
    // Extract original_text using regex
    var originalTextMatch = jsonString.match(/"original_text"\s*:\s*"((?:[^"\\]|\\.)*?)"/);
    if (!originalTextMatch || !originalTextMatch[1]) {
      Logger.log('No original_text found in JSON: ' + jsonString.substring(0, 500));
      return 'N/A';
    }

    var originalText = originalTextMatch[1];
    Logger.log('Extracted original_text: ' + originalText.substring(0, 500));

    // Replace control characters (U+0000 to U+001F and U+0080 to U+009F)
    originalText = originalText.replace(/[\u0000-\u001F\u0080-\u009F]/g, function(match) {
      Logger.log('Removed control character: \\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4));
      return '';
    });

    // Decode Unicode escape sequences (\uXXXX)
    originalText = originalText.replace(/\\u([\dA-F]{4})/gi, function(match, grp) {
      try {
        return String.fromCharCode(parseInt(grp, 16));
      } catch (e) {
        Logger.log('Error decoding Unicode sequence \\u' + grp + ': ' + e);
        return match; // Return original sequence if decoding fails
      }
    });

    Logger.log('Decoded original_text: ' + originalText.substring(0, 500));
    return originalText;
  } catch (e) {
    Logger.log('Error processing raw JSON: ' + e);
    return 'Error: ' + e.message;
  }
}

// Function to write results to a Google Sheet
function writeToSheet(results, sheet, config) {
  // Get all unique keys from results (excluding decoded_original_text for now)
  var allKeys = new Set();
  results.forEach(function(result) {
    Object.keys(result).forEach(function(key) {
      allKeys.add(key);
    });
  });
  var headers = Array.from(allKeys);

  // Add decoded_original_text to headers
  headers.push('decoded_original_text');

  // Clear existing content below headers
  if (sheet.getLastRow() >= config.startRow) {
    sheet.getRange(config.startRow, 2, sheet.getLastRow() - config.startRow + 1, sheet.getLastColumn()).clearContent();
  }

  // Write headers starting from output column
  sheet.getRange(config.startRow - 1, 2, 1, headers.length).setValues([headers]);

  // Prepare data rows
  var dataRows = [];
  results.forEach(function(result, index) {
    var row = headers.map(function(key) {
      if (key === 'decoded_original_text') {
        // Process raw_json to get decoded original_text
        return result.raw_json ? processRawJson(result.raw_json) : 'N/A';
      }
      var value = result[key];
      // Convert to string and handle null/undefined
      return value != null ? String(value) : 'N/A';
    });
    dataRows.push(row);
  });

  // Write data using setValues
  if (dataRows.length > 0) {
    sheet.getRange(config.startRow, 2, dataRows.length, headers.length).setValues(dataRows);
  }
}



----------------------------------------------------------------------------------------------------------Chinese Decoder line by line------------------------------------------------------------------

// Configuration object
const CONFIG388 = {
  sheetName: 'Sheet3',
  jsonColumn: 'M',
  startRow: 2,
  endRow: 6,
  outputColumn: 'O',
  chineseOutputColumn: 'P'
};

// Function to extract Chinese text from JSON
function extractChineseText(jsonCellValue) {
  try {
    const jsonData = JSON.parse(jsonCellValue);
    const originalText = jsonData.original_text;
    
    if (!originalText) {
      Logger.log('No original_text field in JSON');
      return 'Error: No original_text field';
    }
    
    Logger.log(`Extracting HTML from original_text: ${originalText.substring(0, 100)}${originalText.length > 100 ? '...' : ''}`);
    
    // Preprocess HTML to fix encoding issues
    let cleanedHtml = originalText
      .replace(/[\uFFFD�]/g, '') // Remove replacement characters
      .replace(/charset=[^>]+/gi, ''); // Remove charset declarations
    
    // Wrap HTML in a root element and attempt parsing
    let chineseText = '';
    try {
      const htmlParser = XmlService.parse(`<rootJS>${cleanedHtml}</rootJS>`);
      const root = htmlParser.getRootElement();
      const descendants = root.getDescendants();
      
      let paragraphCount = 0;
      for (const item of descendants) {
        if (item.getType() === XmlService.ContentTypes.ELEMENT && item.asElement().getName() === 'p') {
          let text = item.asElement().getText();
          if (text.trim() !== '') {
            paragraphCount++;
            Logger.log(`Raw paragraph ${paragraphCount}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
            
            // Split paragraph into sentences by Chinese punctuation
            const sentences = text.split(/(?<=[。！？])/);
            let decodedSentences = [];
            for (let j = 0; j < sentences.length; j++) {
              if (sentences[j].trim()) {
                Logger.log(`Raw sentence ${j + 1} in paragraph ${paragraphCount}: ${sentences[j].substring(0, 50)}${sentences[j].length > 50 ? '...' : ''}`);
                const decoded = decodeUnicode(sentences[j]);
                Logger.log(`Decoded sentence ${j + 1} in paragraph ${paragraphCount}: ${decoded.substring(0, 50)}${decoded.length > 50 ? '...' : ''}`);
                decodedSentences.push(decoded);
              }
            }
            
            chineseText += decodedSentences.join('') + '\n\n';
          }
        }
      }
      
      return chineseText.trim() || 'No valid paragraphs found';
    } catch (xmlError) {
      Logger.log(`XML parsing error: ${xmlError.message}`);
      return `Error: Invalid HTML - ${xmlError.message}`;
    }
  } catch (jsonError) {
    Logger.log(`JSON parsing error: ${jsonError.message}`);
    return `Error: Invalid JSON - ${jsonError.message}`;
  }
}

// Function to decode Unicode escape sequences and fix UTF-8 misinterpretation
function decodeUnicode(str) {
  try {
    // Handle Unicode escapes (e.g., \u5546 or \\u5546)
    let processed = str.replace(/\\{1,2}u([\dA-F]{4})/gi, (match, grp) => {
      return String.fromCharCode(parseInt(grp, 16));
    });
    
    // Fix UTF-8 bytes misinterpreted as ISO-8859-1
    if (/[\u00C0-\u00FF]/.test(processed)) {
      try {
        // Convert string to raw bytes and reinterpret as UTF-8
        const bytes = [];
        for (let i = 0; i < processed.length; i++) {
          const charCode = processed.charCodeAt(i);
          bytes.push(charCode & 0xFF);
        }
        processed = decodeUtf8Bytes(bytes);
      } catch (e) {
        Logger.log(`UTF-8 decode error: ${e.message}`);
      }
    }
    
    // Handle HTML entities
    processed = processed.replace(/&/g, '&')
                        .replace(/</g, '<')
                        .replace(/>/g, '>')
                        .replace(/"/g, '"')
                        .replace(/'/g, "'");
    
    return processed;
  } catch (e) {
    Logger.log(`Error in decodeUnicode: ${e.message}`);
    return str;
  }
}

// Helper function to decode UTF-8 bytes
function decodeUtf8Bytes(bytes) {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const byte1 = bytes[i];
    if (byte1 < 0x80) {
      // 1-byte character (ASCII)
      result += String.fromCharCode(byte1);
      i++;
    } else if (byte1 >= 0xC2 && byte1 <= 0xDF) {
      // 2-byte character
      if (i + 1 < bytes.length) {
        const byte2 = bytes[i + 1];
        result += String.fromCharCode(((byte1 & 0x1F) << 6) | (byte2 & 0x3F));
        i += 2;
      } else {
        result += String.fromCharCode(0xFFFD); // Replacement character
        i++;
      }
    } else if (byte1 >= 0xE0 && byte1 <= 0xEF) {
      // 3-byte character
      if (i + 2 < bytes.length) {
        const byte2 = bytes[i + 1];
        const byte3 = bytes[i + 2];
        result += String.fromCharCode(((byte1 & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F));
        i += 3;
      } else {
        result += String.fromCharCode(0xFFFD);
        i++;
      }
    } else {
      // Invalid byte
      result += String.fromCharCode(0xFFFD);
      i++;
    }
  }
  return result;
}

// Main function to check cell values and validate JSON
function checkCellValues() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(CONFIG388.sheetName);
    
    if (!sheet) {
      throw new Error(`Sheet "${CONFIG388.sheetName}" not found.`);
    }
    
    if (CONFIG388.startRow < 1 || CONFIG388.endRow < CONFIG388.startRow) {
      throw new Error('Invalid row range. Ensure startRow >= 1 and endRow >= startRow.');
    }
    
    const rangeString = `${CONFIG388.jsonColumn}${CONFIG388.startRow}:${CONFIG388.jsonColumn}${CONFIG388.endRow}`;
    const range = sheet.getRange(rangeString);
    const values = range.getValues();
    
    const outputStatus = [];
    const outputChinese = [];
    for (let i = 0; i < values.length; i++) {
      const cellValue = values[i][0];
      let cellState;
      let chineseText = '';
      
      if (cellValue === undefined) {
        cellState = 'Undefined';
        Logger.log(`Row ${CONFIG388.startRow + i}: Cell is undefined`);
      } else if (cellValue === null) {
        cellState = 'Null';
        Logger.log(`Row ${CONFIG388.startRow + i}: Cell is null`);
      } else if (cellValue === '') {
        cellState = 'Empty string';
        Logger.log(`Row ${CONFIG388.startRow + i}: Cell is empty string`);
      } else if (cellValue.trim() === '') {
        cellState = 'Whitespace only';
        Logger.log(`Row ${CONFIG388.startRow + i}: Cell contains only whitespace`);
      } else {
        try {
          const jsonData = JSON.parse(cellValue);
          cellState = 'Valid JSON';
          Logger.log(`Row ${CONFIG388.startRow + i}: Valid JSON - Content: ${JSON.stringify(jsonData).substring(0, 100)}${JSON.stringify(jsonData).length > 100 ? '...' : ''}`);
          chineseText = extractChineseText(cellValue);
          Logger.log(`Row ${CONFIG388.startRow + i}: Extracted Chinese text: ${chineseText.substring(0, 100)}${chineseText.length > 100 ? '...' : ''}`);
        } catch (e) {
          cellState = 'Non-JSON';
          Logger.log(`Row ${CONFIG388.startRow + i}: Non-JSON - Raw content: "${cellValue.substring(0, 100)}${cellValue.length > 100 ? '...' : ''}" - Error: ${e.message}`);
        }
      }
      outputStatus.push([cellState]);
      outputChinese.push([chineseText]);
    }
    
    const statusRangeString = `${CONFIG388.outputColumn}${CONFIG388.startRow}:${CONFIG388.outputColumn}${CONFIG388.endRow}`;
    const statusRange = sheet.getRange(statusRangeString);
    statusRange.setValues(outputStatus);
    
    const chineseRangeString = `${CONFIG388.chineseOutputColumn}${CONFIG388.startRow}:${CONFIG388.chineseOutputColumn}${CONFIG388.endRow}`;
    const chineseRange = sheet.getRange(chineseRangeString);
    chineseRange.setValues(outputChinese);
    
    Logger.log('Script completed successfully');
  } catch (e) {
    Logger.log(`Main function error: ${e.message}`);
  }
}



----------------------------------------------------------------------------fetch feed for fetch articles---------------------------------------------------------------------------------------


function scrapeNewsBlurFeeds() {
  // Step 1: Authenticate with NewsBlur API
  var loginUrl = 'https://www.newsblur.com/api/login';
  var loginPayload = {
    'username': '', // Replace with your NewsBlur username
    'password': ''  // Replace with your NewsBlur password
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

  // Step 2: Fetch feeds
  var feedsUrl = 'https://www.newsblur.com/reader/feeds';
  var fetchOptions = {
    'method': 'get',
    'headers': {
      'Cookie': sessionCookie
    },
    'muteHttpExceptions': true
  };

  // Make the GET request
  var response = UrlFetchApp.fetch(feedsUrl, fetchOptions);
  var responseCode = response.getResponseCode();
  var responseText = response.getContentText();

  // Step 3: Handle the response
  if (responseCode === 200) {
    var data = JSON.parse(responseText);
    var feeds = data.feeds || [];

    // Log or process the feeds
    Logger.log('Found ' + Object.keys(feeds).length + ' feeds');
    for (var feedId in feeds) {
      var feed = feeds[feedId];
      Logger.log('Feed: ' + feed.feed_title + ' (ID: ' + feedId + ')');
    }

    // Write to a Google Sheet
    writeToSheet(feeds);
  } else {
    Logger.log('Error fetching feeds: ' + responseCode + ' - ' + responseText);
    return;
  }
}

// Function to write feeds to a Google Sheet
function writeToSheet(feeds) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clear(); // Clear existing content
  sheet.appendRow(['Feed ID', 'Feed Title', 'Feed URL', 'Website', 'Subscribers', 'Unread Count']); // Add headers

  for (var feedId in feeds) {
    var feed = feeds[feedId];
    sheet.appendRow([
      feedId || 'N/A',
      feed.feed_title || 'N/A',
      feed.feed_address || 'N/A',
      feed.feed_link || 'N/A',
      feed.num_subscribers || 0,
      (feed.ps || 0) + (feed.nt || 0) + (feed.ng || 0) // Total unread count (positive, neutral, negative)
    ]);
  }
}

----------------------------------------------------------------------------fetch  articles hash by loading articles got---------------------------------------------------------------------------------------
function scrapeNewsBlurRiverStories() {
  // Step 1: Authenticate with NewsBlur API
  var loginUrl = 'https://www.newsblur.com/api/login';
  var loginPayload = {
    'username': '', // Replace with your NewsBlur username
    'password': ''  // Replace with your NewsBlur password
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

  // Step 2: Fetch stories from river_stories endpoint
  var feedIds = ['9689392'];
  var storiesUrl = 'https://www.newsblur.com/reader/river_stories?feeds=' + feedIds.join('&feeds=') + '&page=1&order=newest&read_filter=unread&include_hidden=false';
  var fetchOptions = {
    'method': 'get',
    'headers': {
      'Cookie': sessionCookie
    },
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
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clear(); // Clear existing content

  if (stories.length === 0) {
    Logger.log('No stories to write to sheet');
    return;
  }

  // Collect all unique keys from stories
  var allKeys = new Set();
  stories.forEach(function(story) {
    Object.keys(story).forEach(function(key) {
      allKeys.add(key);
    });
  });

  // Convert Set to Array for headers
  var headers = Array.from(allKeys);
  sheet.appendRow(headers); // Add dynamic headers

  // Write each story's data
  stories.forEach(function(story) {
    var row = headers.map(function(key) {
      // Handle nested objects and arrays gracefully
      if (story[key] && typeof story[key] === 'object') {
        return JSON.stringify(story[key]);
      }
      // Convert to string and handle null/undefined
      return story[key] != null ? String(story[key]) : 'N/A';
    });
    sheet.appendRow(row);
  });
}




