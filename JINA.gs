//JINA.gs scrape text for a list of urls with proxy(need authentication api key trim from 3e for real api, btw it is free just in case) and json output https://jina.ai/ (For multiple urls scrape use) 

function fetchJinaContentFromSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet4');
  if (!sheet) {
    Logger.log('Sheet4 not found');
    return;
  }
  
  const urlColumn = 1; // Column A for URLs
  const titleColumn = 2; // Column B for title (check if empty)
  const startRow = 4; // Start from row 4
  const timeoutSeconds = 60; // 60-second timeout per request
  
  // Get all URLs and check title column
  const lastRow = sheet.getLastRow();
  const range = sheet.getRange(startRow, urlColumn, lastRow - startRow + 1, 2);
  const data = range.getValues();
  
  // Collect headers dynamically
  let allHeaders = new Set(['Error']); // Start with Error column
  const urlData = [];
  
  // Filter URLs where Column B is empty
  for (const [url, title] of data) {
    if (url && !title) {
      urlData.push(url);
    }
  }
  
  if (urlData.length === 0) {
    Logger.log('No URLs to process or all have titles');
    return;
  }
  
  // Process each URL
  const output = [];
  for (const url of urlData) {
    let rowData = {};
    try {
      const startTime = Date.now();
      const response = UrlFetchApp.fetch(`https://r.jina.ai/${url}`, {
        headers: {
          'Accept': 'application/json',
          'X-Return-Format': 'text',
          'Authorization': 'Bearer jina_de33d50dcfbf48908254cae3e9qtdrmkp600787cWzYo8GDgCdUcWqN_IYkpLf8U78HS',
          'X-Proxy': 'auto',

        },
        muteHttpExceptions: true,
        followRedirects: true
      });
      
      const elapsedTime = (Date.now() - startTime) / 1000;
      if (elapsedTime > timeoutSeconds) {
        rowData['Error'] = 'Abandon due to long waiting time than allowed';
        output.push(rowData);
        continue;
      }
      
      const status = response.getResponseCode();
      if (status !== 200) {
        rowData['Error'] = `HTTP error! status: ${status}`;
        output.push(rowData);
        continue;
      }
      
      const data = JSON.parse(response.getContentText());
      
      if (data.code === 200 && data.data) {
        // Extract all headers dynamically from data.data
        for (const key in data.data) {
          if (typeof data.data[key] !== 'object') {
            allHeaders.add(key);
            rowData[key] = data.data[key] || 'N/A';
          } else if (key === 'usage' && data.data[key].tokens) {
            allHeaders.add('tokens');
            rowData['tokens'] = data.data[key].tokens || 'N/A';
          }
        }
      } else {
        rowData['Error'] = 'Invalid response or API error';
      }
    } catch (error) {
      rowData['Error'] = error.message;
    }
    
    output.push(rowData);
    
    // Delay to avoid rate limiting
    Utilities.sleep(1000);
  }
  
  // Write headers to row 3 (assuming row 3 is for headers)
  const headers = Array.from(allHeaders);
  if (headers.length > 0) {
    sheet.getRange(3, titleColumn, 1, headers.length).setValues([headers]);
  }
  
  // Write data to sheet
  for (let i = 0; i < output.length; i++) {
    const row = output[i];
    const rowValues = headers.map(header => row[header] || 'N/A');
    
    // Find the corresponding row in the sheet
    const urlIndex = data.findIndex(([url]) => url === urlData[i]);
    if (urlIndex >= 0) {
      const targetRow = startRow + urlIndex;
      sheet.getRange(targetRow, titleColumn, 1, headers.length).setValues([rowValues]);
    }
  }
  
  Logger.log('Processing complete');
}

// Add menu to run the script from Google Sheets
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Jina API')
    .addItem('Fetch URL Content', 'fetchJinaContentFromSheet')
    .addToUi();
}
