//Basic python Oauth for reddit api demo (Reddit by Python use case)

import praw
import json

# Reddit API setup
reddit = praw.Reddit(
    client_id="",
    client_secret="",
    user_agent="my_first_script by Outside-Iron3291"  # e.g., "MyRedditViewer/1.0 by YourUsername"
)

# Function to fetch and print all attributes of top posts (today)
def inspect_top_posts(subreddit_name, limit=5):
    try:
        # Access subreddit
        subreddit = reddit.subreddit(subreddit_name.strip())

        # Get top posts for today (t='day')
        print(f"Inspecting top {limit} posts from r/{subreddit_name} (today):")
        print("=" * 80)

        for i, submission in enumerate(subreddit.top(time_filter="day", limit=limit), 1):
            print(f"\nPost {i}:")
            print(f"Title: {submission.title}")
            print("-" * 80)

            # Get all attributes of the submission
            submission_vars = vars(submission)

            # Pretty-print all attributes
            print("All attributes of the post:")
            print(json.dumps(submission_vars, indent=4, default=str))

            # Highlight key attributes that might contain GIFs
            print("\nKey attributes that might contain GIFs:")
            print(f"URL: {submission.url}")
            print(f"Thumbnail: {submission.thumbnail}")
            print(f"Media: {submission.media}")
            print(f"Post hint: {getattr(submission, 'post_hint', 'N/A')}")
            print("=" * 80)

    except Exception as e:
        print(f"Error accessing r/{subreddit_name}: {str(e)}")

# Test with r/gifs
inspect_top_posts("jav")
