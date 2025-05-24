//linuxdo_python_selenium_rss.md : Use Selenium in python to fetch rss from linuxdo, which is protected heavily by cloudflare. Fail to retrieve even rss file by politepol, fetchrss or appscript or JINA. Without selenium, python only fetch nothing relevant.

```
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from webdriver_manager.chrome import ChromeDriverManager
from fake_useragent import UserAgent
import time
import feedparser
from bs4 import BeautifulSoup
import pandas as pd
import re
import os
import pickle

# URL of the RSS feed
rss_url = "https://linux.do/top.rss?period=daily"

# Set up Chrome options for headful mode
chrome_options = Options()
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
ua = UserAgent()
chrome_options.add_argument(f"user-agent={ua.random}")
chrome_options.add_argument("accept=application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8")
chrome_options.add_argument("accept-language=en-US,en;q=0.9")
chrome_options.add_argument("accept-encoding=gzip, deflate, br")
chrome_options.add_argument("--enable-javascript")
chrome_options.add_argument("--disable-blink-features=AutomationControlled")
chrome_options.add_experimental_option("prefs", {"profile.default_content_setting_values.cookies": 1})

# Initialize the Chrome driver
driver = webdriver.Chrome(service=webdriver.chrome.service.Service(ChromeDriverManager().install()), options=chrome_options)

try:
    # Hide webdriver property
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": """
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """
    })

    # Navigate to the RSS feed URL
    driver.get(rss_url)

    # Wait for the page to load
    WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )

    # Simulate human-like behavior
    actions = ActionChains(driver)
    actions.move_by_offset(100, 100).pause(1).move_by_offset(-50, 50).perform()
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight / 2);")
    time.sleep(2)
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(30)  # Longer delay for Cloudflare

    # Check for Cloudflare challenge
    page_content = driver.page_source
    if "challenges.cloudflare.com" in driver.current_url or "Checking your browser" in page_content:
        print("Cloudflare challenge detected. Please solve the CAPTCHA.")
        input("Solve the CAPTCHA and press Enter to continue...")
        driver.refresh()
        time.sleep(10)
        page_content = driver.page_source

    # Save cookies
    pickle.dump(driver.get_cookies(), open("cookies.pkl", "wb"))

    # Save raw content for debugging
    with open('rss_feed_raw.html', 'w', encoding='utf-8') as f:
        f.write(page_content)
    print("Raw response saved to 'rss_feed_raw.html'")

    # Extract XML from <pre> tag
    soup_html = BeautifulSoup(page_content, 'html.parser')
    pre_tag = soup_html.find('pre')
    if pre_tag:
        xml_content = pre_tag.text
        print("Extracted XML content from <pre> tag")
    else:
        xml_content = page_content
        print("No <pre> tag found, using raw page content as XML")

    # Save extracted XML
    with open('rss_feed_extracted.xml', 'w', encoding='utf-8') as f:
        f.write(xml_content)
    print("Extracted XML saved to 'rss_feed_extracted.xml'")

    # Function to clean HTML
    def clean_html(raw_html):
        if raw_html:
            clean_text = re.sub(r'<[^>]+>', '', raw_html)
            clean_text = re.sub(r'\s+', ' ', clean_text).strip()
            return clean_text
        return ''

    # Parse with feedparser
    data = []
    try:
        feed = feedparser.parse(xml_content)
        if feed.bozo:
            print(f"feedparser error: {feed.bozo_exception}")
            raise Exception("Invalid RSS feed")
        
        print("Successfully parsed RSS feed with feedparser")
        for entry in feed.entries:
            data.append({
                'title': entry.get('title', ''),
                'link': entry.get('link', ''),
                'description': clean_html(entry.get('description', '')),
                'pubDate': entry.get('published', ''),
                'creator': entry.get('author', ''),
                'category': entry.get('category', ''),
                'guid': entry.get('id', ''),
                'topicPinned': entry.get('discourse_topicpinned', ''),
                'topicClosed': entry.get('discourse_topicclosed', ''),
                'topicArchived': entry.get('discourse_topicarchived', ''),
                'source': entry.get('source', {}).get('title', ''),
                'source_url': entry.get('source', {}).get('url', '')
            })

    except Exception as e:
        print(f"feedparser failed: {e}. Falling back to BeautifulSoup")
        soup = BeautifulSoup(xml_content, 'lxml-xml')
        items = soup.find_all('item')
        for item in items:
            title = item.find('title').text if item.find('title') else ''
            link = item.find('link').text if item.find('link') else ''
            description = item.find('description')
            description_text = clean_html(description.text) if description else ''
            pub_date = item.find('pubDate').text if item.find('pubDate') else ''
            creator = item.find('dc:creator').text if item.find('dc:creator') else ''
            category = item.find('category').text if item.find('category') else ''
            guid = item.find('guid').text if item.find('guid') else ''
            topic_pinned = item.find('discourse:topicPinned').text if item.find('discourse:topicPinned') else ''
            topic_closed = item.find('discourse:topicClosed').text if item.find('discourse:topicClosed') else ''
            topic_archived = item.find('discourse:topicArchived').text if item.find('discourse:topicArchived') else ''
            source = item.find('source')
            source_text = source.text if source else ''
            source_url = source.get('url', '') if source else ''

            data.append({
                'title': title,
                'link': link,
                'description': description_text,
                'pubDate': pub_date,
                'creator': creator,
                'category': category,
                'guid': guid,
                'topicPinned': topic_pinned,
                'topicClosed': topic_closed,
                'topicArchived': topic_archived,
                'source': source_text,
                'source_url': source_url
            })

    # Create DataFrame
    df = pd.DataFrame(data)
    print("\nParsed RSS Feed DataFrame:")
    print(df)

    # Save or append to CSV
    csv_file = 'linuxdo_generaltopdaily.csv'
    if os.path.exists(csv_file):
        df.to_csv(csv_file, mode='a', header=False, index=False, encoding='utf-8')
        print(f"Data appended to '{csv_file}'")
    else:
        df.to_csv(csv_file, index=False, encoding='utf-8')
        print(f"Data saved to new file '{csv_file}'")

except Exception as e:
    print(f"Error fetching or processing RSS feed: {e}")
    page_content = driver.page_source
    with open('rss_feed_error.html', 'w', encoding='utf-8') as f:
        f.write(page_content)
    print("Error response saved to 'rss_feed_error.html'")

finally:
    driver.quit()
```
