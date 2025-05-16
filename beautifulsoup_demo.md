//Beautiful soup demo for scraping text from static html (For static html parse)

import requests
from bs4 import BeautifulSoup
import time
import csv
import pandas as pd
from google.colab import files

# Configuration
config = {
    'input_csv': 'urls.csv',  # Upload your CSV with URLs
    'output_file': 'scraped_content.csv',
    'raw_html_file': 'raw_html.txt',
    'request_delay': 2.0  # Seconds between requests
}

# Headers to mimic a browser
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
}

def fetch_and_parse_content(url):
    try:
        # Fetch the page
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        print(f"HTTP Status for {url}: {response.status_code}")

        # Save raw HTML snippet for debugging
        with open(config['raw_html_file'], 'a', encoding='utf-8') as f:
            f.write(f"URL: {url}\n")
            f.write(response.text[:2000] + "\n\n")

        # Check if caas-body exists in raw HTML
        if 'caas-body' not in response.text:
            print(f"Warning: 'caas-body' not found in raw HTML for {url}")

        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find <div class="caas-body">
        caas_body = soup.find('div', class_='caas-body')
        if caas_body:
            print(f"Found caas-body for {url}")
            # Extract text from each element, stripping whitespace
            text_segments = [text.strip() for text in caas_body.stripped_strings if text.strip()]
            # Join segments with | delimiter
            content = '|'.join(text_segments)
            return content if content else "No text content in caas-body"
        else:
            print(f"No caas-body found for {url}")
            # Fallback to other containers
            caas_body = soup.find('div', class_='caas-content') or soup.find('div', class_='article-body')
            if caas_body:
                print(f"Found fallback container for {url}")
                text_segments = [text.strip() for text in caas_body.stripped_strings if text.strip()]
                content = '|'.join(text_segments)
                return content if content else "No text content in fallback"

            # Fallback to meta description
            meta = soup.find('meta', attrs={'name': 'description'})
            if meta and meta.get('content'):
                print(f"Extracted meta description for {url}")
                return meta.get('content').replace('\n', '|')

            return "No content found"

    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return f"Error: {e}"
    except Exception as e:
        print(f"Error parsing {url}: {e}")
        return f"Error: {e}"

def main():
    # Read URLs from headerless CSV
    try:
        df = pd.read_csv(config['input_csv'], header=None)
        urls = df[0].dropna().tolist()  # First column (index 0)
        print(f"Loaded {len(urls)} URLs from {config['input_csv']}")
    except Exception as e:
        print(f"Error reading {config['input_csv']}: {e}")
        return

    results = []
    for url in urls:
        print(f"\nProcessing {url}")
        content = fetch_and_parse_content(url)
        results.append([url, content])
        time.sleep(config['request_delay'])

    # Save results to CSV
    with open(config['output_file'], 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['URL', 'Content'])
        writer.writerows(results)

    print(f"\nResults saved to {config['output_file']}")
    files.download(config['output_file'])
    files.download(config['raw_html_file'])

if __name__ == "__main__":
    main()
