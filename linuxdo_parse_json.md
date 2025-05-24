// linuxdo_json.md : using puppeteer to fetch json file with pagination in general, 14 and tag ai with timefilter daily and weekly. 
```
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');

// Add stealth plugin to reduce bot detection
puppeteer.use(StealthPlugin());

// Configuration table
const CONFIG = {
    startPage: 1, // Starting page number
    endPage: 1,   // Ending page number
    perPage: 50,  // Number of items per page
    baseUrl: 'https://linux.do/c/resource/14/l/top.json?filter=top&page={page}&per_page={perPage}&period=daily',
    initialUrl: 'https://linux.do/c/resource/14/l/top.json?&per_page=50&period=daily', // Initial page without page parameter
    outputCsv: 'linuxdo_14_topdaily.csv'
};

async function scrapePage(browser, url, pageNum) {
    const page = await browser.newPage();

    try {
        // Set a random user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36');

        // Set viewport to mimic a real user
        await page.setViewport({ width: 1920, height: 1080 });

        // Enable JavaScript and set extra headers
        await page.setExtraHTTPHeaders({
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br'
        });

        // Navigate to the URL
        console.log(`Fetching ${pageNum === 0 ? 'initial page' : 'page ' + pageNum} from ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Check for Cloudflare challenge
        const content = await page.content();
        if (content.includes('challenges.cloudflare.com') || content.includes('Checking your browser')) {
            console.log('Cloudflare challenge detected. Please solve the CAPTCHA in the browser window.');
            await page.waitForTimeout(45000); // 45 seconds to solve CAPTCHA
            await page.reload({ waitUntil: 'networkidle2' });
        }

        // Extract JSON from <pre> tag or page content
        const jsonContent = await page.evaluate(() => {
            const preTag = document.querySelector('pre');
            return preTag ? preTag.textContent : document.body.textContent;
        });
        console.log(`Extracted content for ${pageNum === 0 ? 'initial page' : 'page ' + pageNum}: ${jsonContent.slice(0, 200)}...`);

        // Parse JSON data
        let topics = [];
        try {
            const jsonData = JSON.parse(jsonContent);
            // Access topics from topic_list.topics instead of topics
            topics = jsonData.topic_list && jsonData.topic_list.topics ? jsonData.topic_list.topics : [];
            if (!topics.length) {
                console.log(`No topics found on ${pageNum === 0 ? 'initial page' : 'page ' + pageNum}`);
                console.log(`JSON data keys: ${Object.keys(jsonData)}`);
                if (jsonData.topic_list) {
                    console.log(`topic_list keys: ${Object.keys(jsonData.topic_list)}`);
                }
            } else {
                console.log(`Successfully parsed JSON data for ${pageNum === 0 ? 'initial page' : 'page ' + pageNum}, found ${topics.length} topics`);
            }
        } catch (error) {
            console.error(`JSON parsing failed for ${pageNum === 0 ? 'initial page' : 'page ' + pageNum}: ${error.message}`);
            console.error(`JSON content causing error: ${jsonContent.slice(0, 500)}...`);
        }

        return topics;
    } catch (error) {
        console.error(`Error fetching or processing data for ${pageNum === 0 ? 'initial page' : 'page ' + pageNum}: ${error.message}`);
        return [];
    } finally {
        await page.close();
    }
}

async function main() {
    // Launch browser in headful mode to allow manual CAPTCHA solving
    const browser = await puppeteer.launch({
        headless: false, // Headful mode for CAPTCHA handling
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--enable-javascript',
            '--window-size=1920,1080'
        ]
    });

    try {
        // Scrape all pages
        let allTopics = [];

        // Scrape the initial page
        console.log('Scraping initial page...');
        const initialTopics = await scrapePage(browser, CONFIG.initialUrl, 0);
        allTopics = allTopics.concat(initialTopics);

        // Scrape paginated pages
        for (let page = CONFIG.startPage; page <= CONFIG.endPage; page++) {
            const url = CONFIG.baseUrl.replace('{page}', page).replace('{perPage}', CONFIG.perPage);
            const topics = await scrapePage(browser, url, page);
            allTopics = allTopics.concat(topics);
        }

        if (!allTopics.length) {
            console.log('No topics collected from any page.');
            return;
        }

        // Flatten nested structures for CSV
        const flattenedData = allTopics.map(topic => {
            const flattenedTopic = {};
            for (const [key, value] of Object.entries(topic)) {
                flattenedTopic[key] = typeof value === 'object' ? JSON.stringify(value) : value;
            }
            return flattenedTopic;
        });

        // Define CSV writer
        const csvWriter = createObjectCsvWriter({
            path: CONFIG.outputCsv,
            header: Object.keys(flattenedData[0]).map(key => ({ id: key, title: key })),
            append: fs.existsSync(CONFIG.outputCsv) // Append if file exists
        });

        // Write to CSV
        await csvWriter.writeRecords(flattenedData);
        console.log(fs.existsSync(CONFIG.outputCsv) ?
            `Data appended to '${CONFIG.outputCsv}'` :
            `Data saved to new file '${CONFIG.outputCsv}'`);

        // Log a preview of the data
        console.log('\nParsed JSON Data Preview:');
        console.log(flattenedData.slice(0, 5));
    } finally {
        await browser.close();
    }
}

// Run the script
main().catch(error => {
    console.error(`Main execution failed: ${error.message}`);
    process.exit(1);
});
```
