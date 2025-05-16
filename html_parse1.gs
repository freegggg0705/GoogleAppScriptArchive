//html_parse1.gs: parse successfully for 吾愛破解 by loop of attempts. (Aggressive Parse static html with heavy malfuncition code use)


function scrapeForum() {
  // config4uration
  const config4 = {
    url: 'https://www.52pojie.cn/forum-16-1.html',
    containerSelector: '//tbody[contains(@id, "normalthread")]',
    elements: [
      {
        name: 'href',
        selector: '.new a.s.xst',
        attribute: 'href'
      },
      {
        name: 'text1',
        selector: '.new a.s.xst',
        attribute: 'text'
      },
      {
        name: 'text2',
        selector: '.new em a',
        attribute: 'text'
      }
    ]
  };

  // Spreadsheet setup
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Sheet7");;
  const startRow = 4;
  const startCol = 1;

  // Fetch options
  const fetchOptions = {
    muteHttpExceptions: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    },
    followRedirects: true,
    validateHttpsCertificates: true
  };

  // Retry config4uration
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  // Initialize content
  let content = '';

  // Fetch and parse webpage
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      Logger.log(`Attempt ${attempt}: Fetching URL: ${config4.url}`);
      const response = UrlFetchApp.fetch(config4.url, fetchOptions);
      const statusCode = response.getResponseCode();
      content = response.getContentText();

      Logger.log(`Response status: ${statusCode}`);
      Logger.log(`Response headers: ${JSON.stringify(response.getHeaders())}`);
      Logger.log(`Response content (first 500 chars): ${content.substring(0, 500)}`);

      if (statusCode !== 200) {
        Logger.log(`Fetch failed with status ${statusCode}: ${content.substring(0, 200)}...`);
        if (attempt < maxRetries) {
          Logger.log(`Retrying in ${retryDelay}ms...`);
          Utilities.sleep(retryDelay);
          continue;
        }
        return;
      }

      // Enhanced HTML cleanup
      // 1. Fix unescaped ampersands
      content = content.replace(/&(?!(?:[a-zA-Z0-9]+|#[0-9]+|#x[0-9a-fA-F]+);)/g, '&amp;');
      // 2. Fix malformed attributes like <input checked>
      content = content.replace(/<input([^>]*)\bchecked\b([^>]*>)/gi, '<input$1 checked="checked"$2');
      // 3. Fix unclosed meta tags
      content = content.replace(/<meta([^>]*?)(\/?>|$)/gi, '<meta$1/>');
      // 4. Remove CDATA and comments
      content = content.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
      content = content.replace(/<!--[\s\S]*?-->/g, '');
      // 5. Fix unquoted attributes
      content = content.replace(/(\w+)=([^"\s>][^>\s]*)(?=[>\s])/g, '$1="$2"');
      // 6. Fix malformed entities like &fid
      content = content.replace(/&fid(?![a-zA-Z0-9])/g, '&amp;fid');

      // Parse the cleaned content
      const xmlDoc = XmlService.parse(content);
      const containers = xmlDoc.getRootElement().getDescendants()
        .filter(node => node.getType() === XmlService.ElementType.ELEMENT)
        .filter(node => node.getName() === 'tbody' && node.getAttribute('id') && node.getAttribute('id').getValue().includes('normalthread'));

      // Logging
      let totalItems = containers.length;
      let scrapedData = [];
      Logger.log(`Total items spotted: ${totalItems}`);

      // Scrape data
      containers.forEach(container => {
        let rowData = {};
        
        config4.elements.forEach(element => {
          let selectorParts = element.selector.split(' ');
          let currentElement = container;
          
          selectorParts.forEach(part => {
            if (part.startsWith('.')) {
              let className = part.substring(1);
              currentElement = currentElement.getChildren()
                .find(child => child.getAttribute('class') && child.getAttribute('class').getValue().includes(className));
            } else {
              currentElement = currentElement.getChild(part);
            }
          });

          if (currentElement) {
            let value = element.attribute === 'text' ? currentElement.getText() : 
                        element.attribute === 'href' ? currentElement.getAttribute('href').getValue() :
                        '';
            rowData[element.name] = value;
          }
        });

        rowData.google_create_date = new Date().toISOString();
        Logger.log(`Scraped unit: ${JSON.stringify(rowData)}`);
        
        if (Object.keys(rowData).length === config4.elements.length + 1) {
          scrapedData.push(rowData);
        }
      });

      // Append to sheet
      if (scrapedData.length > 0) {
        let headers = ['href', 'text1', 'text2', 'google_create_date'];
        if (sheet.getLastRow() < startRow) {
          sheet.getRange(startRow - 1, startCol, 1, headers.length).setValues([headers]);
        }

        let sheetData = scrapedData.map(row => [
          row.href,
          row.text1,
          row.text2,
          row.google_create_date
        ]);

        sheet.getRange(sheet.getLastRow() + 1, startCol, sheetData.length, sheetData[0].length).setValues(sheetData);

        let lastRow = sheet.getLastRow();
        let dataRange = sheet.getRange(startRow, startCol, lastRow - startRow + 1, headers.length);
        let allData = dataRange.getValues();

        allData.sort((a, b) => new Date(b[3]) - new Date(a[3]));

        let uniqueData = [];
        let seenHrefs = new Set();
        allData.forEach(row => {
          if (!seenHrefs.has(row[0])) {
            uniqueData.push(row);
            seenHrefs.add(row[0]);
          }
        });

        dataRange.clearContent();
        sheet.getRange(startRow, startCol, uniqueData.length, uniqueData[0].length).setValues(uniqueData);

        Logger.log(`Total non-duplicate units found: ${uniqueData.length}`);
      } else {
        Logger.log('No new data scraped');
      }

      // Success, no need to retry
      break;

    } catch (e) {
      Logger.log(`Attempt ${attempt} failed. Error: ${e.message}`);
      Logger.log(`Content snippet: ${content ? content.substring(0, 500) : 'No content available'}`);
      if (attempt < maxRetries) {
        Logger.log(`Retrying in ${retryDelay}ms...`);
        Utilities.sleep(retryDelay);
      } else {
        Logger.log('Max retries reached. Giving up.');
        // Fallback parsing with regex
        Logger.log('Attempting fallback parsing with regex...');
        try {
          let scrapedData = fallbackParse(content, config4.elements);
          if (scrapedData.length > 0) {
            let headers = ['href', 'text1', 'text2', 'google_create_date'];
            if (sheet.getLastRow() < startRow) {
              sheet.getRange(startRow - 1, startCol, 1, headers.length).setValues([headers]);
            }
            let sheetData = scrapedData.map(row => [
              row.href,
              row.text1,
              row.text2,
              row.google_create_date
            ]);
            sheet.getRange(sheet.getLastRow() + 1, startCol, sheetData.length, sheetData[0].length).setValues(sheetData);
            Logger.log(`Fallback parsing successful. Scraped ${scrapedData.length} items.`);
          } else {
            Logger.log('Fallback parsing failed: No data scraped.');
          }
        } catch (fallbackError) {
          Logger.log(`Fallback parsing error: ${fallbackError.message}`);
        }
      }
    }
  }
}

// Fallback parsing function using regex
function fallbackParse(content, elements) {
  let scrapedData = [];
  // Regex to match tbody elements with id containing "normalthread"
  const tbodyRegex = /<tbody[^>]*id="normalthread_\d+"[^>]*>([\s\S]*?)<\/tbody>/gi;
  let tbodyMatches = content.matchAll(tbodyRegex);

  for (let tbodyMatch of tbodyMatches) {
    let tbodyContent = tbodyMatch[1];
    let rowData = {};

    elements.forEach(element => {
      let regex;
      if (element.selector === '.new a.s.xst' && element.attribute === 'href') {
        regex = /<a[^>]*class="s xst"[^>]*href="([^"]+)"[^>]*>/i;
        let match = tbodyContent.match(regex);
        rowData[element.name] = match ? match[1] : '';
      } else if (element.selector === '.new a.s.xst' && element.attribute === 'text') {
        regex = /<a[^>]*class="s xst"[^>]*>([^<]+)</i;
        let match = tbodyContent.match(regex);
        rowData[element.name] = match ? match[1] : '';
      } else if (element.selector === '.new em a' && element.attribute === 'text') {
        regex = /<em[^>]*>\s*<a[^>]*>([^<]+)</i;
        let match = tbodyContent.match(regex);
        rowData[element.name] = match ? match[1] : '';
      }
    });

    rowData.google_create_date = new Date().toISOString();
    if (Object.keys(rowData).length === elements.length + 1) {
      scrapedData.push(rowData);
    }
  }

  return scrapedData;
}
