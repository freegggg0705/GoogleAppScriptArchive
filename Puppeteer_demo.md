// Puppeteer_demo for showcase firefoxgggg in replit execution successful once route (Dynamic site scrape use)


```index.js
const puppeteer = require('puppeteer');
const { exec } = require('node:child_process');
const { promisify } = require('node:util');

// Configuration
const TARGET_URL = 'https://lihkg.com/category/1';

async function scrapeLIHKG() {
  // Find Chromium path
  const { stdout: chromiumPath } = await promisify(exec)('which chromium');

  // Launch browser
  const browser = await puppeteer.launch({
    executablePath: chromiumPath.trim(),
    headless: 'new', // Headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Navigate to the page and wait for JavaScript to render
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
    // Add extra wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Debugging: Capture page HTML
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    await require('fs').promises.writeFile('debug.html', html);
    console.log('Saved page HTML to debug.html for inspection.');

    // Try scraping href using updated XPath
    const href = await page.evaluate(() => {
      const link = document.evaluate(
    '//a[@class="_2A_7bGY9QAXcGu1neEYDJB" and contains(@href, "/thread/")][1]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;

      return link ? link.getAttribute('href') : null;
    });

    // Display result in console
    if (href) {
      console.log('Scraped Link:');
      console.log(`  URL: https://lihkg.com${href}`);
    } else {
      console.log('No link found with XPath. Trying CSS selector fallback...');
      // Fallback: Try CSS selector for thread links
      const fallbackHref = await page.evaluate(() => {
        const link = document.querySelector('div.thread-list a[href*="/thread/"]');
        return link ? link.getAttribute('href') : null;
      });
      if (fallbackHref) {
        console.log('Scraped Link (CSS fallback):');
        console.log(`  URL: https://lihkg.com${fallbackHref}`);
      } else {
        console.log('No link found with CSS fallback either. Check debug.html.');
      }
    }

    return href || null;
  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the scraper
scrapeLIHKG()
  .then(href => {
    console.log(href ? 'Successfully scraped 1 link.' : 'Failed to scrape link.');
  })
  .catch(error => {
    console.error('Error running scraper:', error);
  });
```

```replit.nix
{ pkgs }: {
  deps = [pkgs.chromium

  ];
}
```

How to Run Puppeteer on Replit?
https://medium.com/@mallailqadrillah43/how-to-run-puppeteer-on-replit-8a8622a8969b
```
Step 2: Install Puppeteer
To install Puppeteer in your Replit project, follow these instructions:

Open the Shell in your Replit project.
Type the following command and hit Enter to install Puppeteer:
npm install puppeteer
```
[Shell in left sidebar All tool]
[create file for replit.nix]
