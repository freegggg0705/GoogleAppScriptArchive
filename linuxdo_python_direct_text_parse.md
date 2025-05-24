//linuxdo_python_direct_text_parse.md : Use selenium in python to fetch thread by beautifulsoup for entire html and for each item, but without infinite scroll which is blocked by cloudflare to load anything.


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
import re
import pandas as pd
from bs4 import BeautifulSoup
import os
import pickle
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# URL of the webpage to scrape
url = "https://linux.do/c/resource/14/l/top?period=weekly"

# Set up Chrome options
chrome_options = Options()
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
ua = UserAgent()
chrome_options.add_argument(f"user-agent={ua.random}")
chrome_options.add_argument("accept=text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
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

    # Navigate to the webpage URL
    driver.get(url)

    # Wait for the page to load
    WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.TAG_NAME, "tbody"))
    )

    # Simulate human-like behavior
    actions = ActionChains(driver)
    actions.move_by_offset(100, 100).pause(1).move_by_offset(-50, 50).perform()
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight / 2);")
    time.sleep(2)
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(10)  # Reduced sleep time, adjust as needed

    # Check for Cloudflare challenge
    page_content = driver.page_source
    if "challenges.cloudflare.com" in driver.current_url or "Checking your browser" in page_content:
        logging.warning("Cloudflare challenge detected. Please solve the CAPTCHA.")
        input("Solve the CAPTCHA and press Enter to continue...")
        driver.refresh()
        time.sleep(10)
        page_content = driver.page_source

    # Save cookies
    pickle.dump(driver.get_cookies(), open("cookies.pkl", "wb"))

    # Save raw content for debugging
    with open('page_raw.html', 'w', encoding='utf-8') as f:
        f.write(page_content)
    logging.info("Raw response saved to 'page_raw.html'")

    # Parse HTML with BeautifulSoup
    soup = BeautifulSoup(page_content, 'html.parser')
    tbody = soup.find('tbody', class_='topic-list-body')
    if not tbody:
        logging.error("Error: <tbody class='topic-list-body'> not found")
        raise Exception("Failed to find topic list body")

    # Extract <tr> elements
    data = []
    tr_elements = tbody.find_all('tr', {'data-topic-id': re.compile(r'\d+')})
    if not tr_elements:
        logging.error("Error: No <tr> elements found in tbody")
        raise Exception("Failed to find topic rows")

    # Process each <tr> element using BeautifulSoup
    for tr in tr_elements:
        topic_data = {}
        
        # Extract topic_id
        topic_data['topic_id'] = tr.get('data-topic-id', '')
        
        # Extract href and title
        title_link = tr.find('a', class_='title raw-link raw-topic-link')
        topic_data['href'] = title_link.get('href', '') if title_link else ''
        title_span = title_link.find('span', {'dir': 'auto'}) if title_link else None
        topic_data['title'] = title_span.text.strip() if title_span else ''
        
        # Extract tags
        tags_div = tr.find('div', class_='discourse-tags')
        if tags_div:
            tags = [a.get('data-tag-name', '') for a in tags_div.find_all('a', class_='discourse-tag')]
            topic_data['tags'] = '|'.join(tag for tag in tags if tag)
        else:
            topic_data['tags'] = ''
        
        # Extract date_info
        age_span = tr.find('span', class_='age activity')
        topic_data['date_info'] = age_span.get('title', '') if age_span else ''
        
        data.append(topic_data)

    # Create DataFrame
    df = pd.DataFrame(data)
    logging.info("\nParsed Webpage DataFrame:\n%s", df)

    # Save or append to CSV
    csv_file = 'linuxdo_resource_topweekly_again.csv'
    if os.path.exists(csv_file):
        df.to_csv(csv_file, mode='a', header=False, index=False, encoding='utf-8')
        logging.info(f"Data appended to '{csv_file}'")
    else:
        df.to_csv(csv_file, index=False, encoding='utf-8')
        logging.info(f"Data saved to new file '{csv_file}'")

except Exception as e:
    logging.error(f"Error fetching or processing webpage: {e}")
    page_content = driver.page_source
    with open('page_error.html', 'w', encoding='utf-8') as f:
        f.write(page_content)
    logging.info("Error response saved to 'page_error.html'")

finally:
    driver.quit()
```
