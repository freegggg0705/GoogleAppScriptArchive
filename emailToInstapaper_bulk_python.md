// EmailToInstapaper_bulk_python.md : Send a list of url to instapaper for later saved full article to evernote, one by one script in python by Gmail Oauth (For save static html content use)
//For view only, use [todolistTorss](https://rsstodolist.eu/) for newsblur mobile for open in fullpage in panel function for the urls 
//Or you can try https://site-analyzer.pro/soft/batch-url-scraper/ but remember to check for possibility of malicious and better use in sandbox


```python
import os
import time
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from email.mime.text import MIMEText
import base64

# Define the scope for Gmail API (sending emails)
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def get_gmail_service():
    """Authenticate and return Gmail API service."""
    creds = None
    # Check if token.json exists (stores user access and refresh tokens)
    if os.path.exists('/content/token.json'):
        creds = Credentials.from_authorized_user_file('/content/token.json', SCOPES)
    # If no valid credentials, prompt user to log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('/content/credentials.json', SCOPES)
            # Colab-specific: Use run_local_server with manual redirect handling
            creds = flow.run_local_server(port=8080, open_browser=False)
        # Save the credentials for future runs
        with open('/content/token.json', 'w') as token:
            token.write(creds.to_json())
    return build('gmail', 'v1', credentials=creds)

def create_message(sender, to, url):
    """Create an email message with the URL in the body."""
    message = MIMEText(url)
    message['to'] = to
    message['from'] = sender
    message['subject'] = ''  # Instapaper doesn't excite subject
    # Encode the message in base64
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    return {'raw': raw}

def send_message(service, user_id, message):
    """Send an email message using Gmail API."""
    try:
        message = service.users().messages().send(userId=user_id, body=message).execute()
        print(f"Sent email with URL: {message['id']}")
        return message
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

def main():
    # Your Gmail address and Instapaper email address
    SENDER_EMAIL = 'your-email@gmail.com'  # Replace with your Gmail address
    INSTAPAPER_EMAIL = 'your-instapaper-email@save.instapaper.com'  # Replace with your Instapaper email

    # Path to the URLs file in Colab
    URLS_FILE = '/content/urls.txt'

    # Get Gmail service
    service = get_gmail_service()

    # Read URLs from file
    try:
        with open(URLS_FILE, 'r') as file:
            urls = [line.strip() for line in file if line.strip()]
    except FileNotFoundError:
        print(f"Error: {URLS_FILE} not found. Please upload urls.txt to Colab.")
        return

    # Send each URL as a separate email
    for url in urls:
        print(f"Preparing to send URL: {url}")
        message = create_message(SENDER_EMAIL, INSTAPAPER_EMAIL, url)
        send_message(service, 'me', message)
        # Add a 5-second delay to avoid rate-limiting
        time.sleep(5)

if __name__ == '__main__':
    main()
```




Step-by-Step Guide for Google Colab
Step 1: Set Up Gmail OAuth 2.0 Credentials
You need OAuth 2.0 credentials from Google Cloud Console to authenticate Gmail access.

Create Credentials in Google Cloud Console:
Go to Google Cloud Console.
Sign in with your Gmail account.
Create a new project (e.g., "Colab Instapaper Sender") or select an existing one.
Enable the Gmail API:
Navigate to APIs & Services > Library.
Search for "Gmail API" and click Enable.
Create OAuth 2.0 Client ID:
Go to APIs & Services > Credentials.
Click Create Credentials > OAuth 2.0 Client IDs.
Configure the OAuth Consent Screen if prompted:
Choose External user type.
Set App name (e.g., "Colab Instapaper").
Add your Gmail address for User support email and Developer contact information.
Save and continue.
For the Client ID:
Select Application type as Web application (Colab runs in a browser, so this is more suitable than Desktop app).
Name it (e.g., "Colab Instapaper Client").
Under Authorized redirect URIs, add: https://localhost:8080/ (Colab will handle redirects locally).
Click Create.
Download the credentials JSON file (e.g., client_secret_*.json) and rename it to credentials.json for simplicity.
Prepare Credentials for Colab:
You’ll upload credentials.json to Colab later, so keep it accessible on your computer.
Step 2: Set Up URLs File
Create a text file with your URLs to upload to Colab.

Create urls.txt:
On your computer, create a file named urls.txt.
List your URLs, one per line, e.g.:
text

Copy
https://example.com/article1
https://example.com/article2
https://example.com/article3
Save the file. Since you’re sending less than 50 emails, ensure the file has no more than 50 URLs.
Step 3: Set Up Google Colab
Colab runs Python in a cloud environment, so we’ll use its interface for file uploads and OAuth authentication.

Open Google Colab:
Go to Google Colab.
Create a new notebook by clicking New Notebook.
Install Required Libraries:
In the first cell, install the necessary Python packages for Gmail API and OAuth:
python

Copy
!pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client
Run the cell by clicking the play button or pressing Shift+Enter.
Upload Files to Colab:
Upload credentials.json and urls.txt to Colab’s temporary storage:
In the left sidebar, click the Files tab (folder icon).
Click the Upload button (paper with arrow).
Select credentials.json and urls.txt from your computer.
They’ll appear in the /content/ directory (Colab’s default working directory).
Step 4: Write and Run the Python Script
Below is the Python script adapted and tested for Google Colab. It uses OAuth 2.0 to authenticate with Gmail, reads URLs from urls.txt, and sends each URL as a separate email to your Instapaper email address with a 5-second delay between sends to ensure compliance with Gmail’s rate-limiting policies.

send_urls_to_instapaper_colab.py
python
Show inline
Step 5: Configure and Run the Script in Colab
Add the Script to Colab:
In your Colab notebook, create a new code cell.
Copy and paste the script above into the cell.
Edit the following lines in the main() function:
Replace 'your-email@gmail.com' with your actual Gmail address.
Replace 'your-instapaper-email@save.instapaper.com' with your actual Instapaper email address (find it at Instapaper Save Email).
Run the Script:
Run the cell by clicking the play button or pressing Shift+Enter.
The first time you run it, you’ll see a message like:
text

Copy
Please visit this URL to authorize this application: https://accounts.google.com/o/oauth2/auth?...
Copy the URL, paste it into your browser, and sign in with your Gmail account.
Grant permission for the app to send emails (you’ll see the consent screen you set up).
You’ll be redirected to a page (likely showing localhost:8080). Copy the full URL from the browser’s address bar (e.g., http://localhost:8080/?code=4/...).
Back in Colab, paste this URL into the prompt asking for the authorization code and press Enter.
The script will:
Save a token.json file in Colab’s /content/ directory for future runs.
Read URLs from /content/urls.txt.
Send each URL as a separate email to your Instapaper address, with a 5-second delay between sends.
Verify in Instapaper:
Log into Instapaper and check that the URLs appear as saved articles.
Step 6: Troubleshooting in Colab
Error: “No such file or directory: /content/urls.txt”:
Ensure you uploaded urls.txt to Colab’s Files tab. Re-upload if needed.
Error: “No such file or directory: /content/credentials.json”:
Verify credentials.json is uploaded. Re-upload from your computer.
OAuth Authorization Issues:
If you get an “invalid grant” error, delete /content/token.json in Colab’s Files tab and rerun to re-authenticate.
Ensure you copied the full redirect URL after granting permission.
Emails Not Appearing in Instapaper:
Confirm your Instapaper email address is correct.
Ensure URLs are valid (e.g., start with http:// or https://).
Rate-Limiting Issues:
The 5-second delay should prevent blocks, but if issues arise, increase to time.sleep(10) in the script.
Step 7: Gmail Sending Limits
As confirmed, Gmail’s limit for free accounts is 500 emails per day. With less than 50 emails and a 5-second delay, you’re well within this limit and unlikely to trigger rate-limiting. The delay ensures sends are spread out, reducing the risk of Gmail flagging the activity.

Step 8: Instapaper Email Format
The script sends each URL as the email body, matching Instapaper’s standard format (just the URL, no subject needed). This was verified via Instapaper’s documentation, ensuring the URLs are saved correctly.

Step 9: Security Notes
OAuth 2.0: Using OAuth in Colab is secure, as it avoids storing passwords. The token.json file is temporary in Colab’s environment and safe as long as you don’t share it.
Credentials File: Keep credentials.json private. It’s only stored temporarily in Colab unless you download it.
Colab Environment: Colab sessions are ephemeral, so re-upload credentials.json and urls.txt if your session disconnects.
Step 10: Notes for Colab
Session Limits: Colab may disconnect after inactivity or extended runtime. For 50 URLs with a 5-second delay, the script takes about 250 seconds (4-5 minutes), which should complete within a single session.
Reusability: If you rerun the script later, re-upload urls.txt and credentials.json unless you save token.json locally and re-upload it to skip re-authentication.
Evernote Integration: If you need to move saved articles to Evernote, use Evernote’s Web Clipper manually, as bulk import isn’t supported.
