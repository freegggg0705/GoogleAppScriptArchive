rss1.gs : RSS feed append only , not refreshing old items record , dynamic column creating, google create date creating (For append use)    
rss2.gs : Preset column amount, sort by third column, and de-duplicate by second column, no google create date ( For append use )   

api1.gs: dynamic column, with google create date, sort by google create date latest to oldest , remove duplicate by string(thread_id), decode hex for chinese (Update old entires use) 
  
api2.gs : With authentication,with endpoint params config, dynamic column with google create date, sort by google create date, remove duplicate (Update old entires use with Oauth and endpoints param)          

redditapi.gs : sort by google create date from latest to oldest , remove duplicate, recursion for non duplicate item until maxattempt (Update old entires use) (multireddit available) 

redditapi2.gs : aggregate multiple subreddit parse, just stack no sort and de-duplication, yellow line to split every retrieval, list can have only 1 item (Append use)     

multiredditapi.gs: multireddit by default, yellow line split, no sort and de-duplicate (Append use only) (subreddit available)

rss_and_parse_text.gs : append with google create date, then multiple sort: FIRST by LINK , SECOND by google create date from oldest to latest. Then copy and paste above row content column to itself if LINK column above equal itself, to reduce text parse workload.       
> Then, for all empty cell left in content column, perform regex parse. Finally, sort by google_create_date from latest to oldest, then remove duplicate. (Update old entires with parsing use)   

html_parse1.gs: parse successfully for 吾愛破解 by loop of attempts. (Aggressive Parse static html with heavy malfuncition code use)

Puppeteer_demo.md : for showcase firefoxgggg in replit execution successful once route (Dynamic site scrape use)    
Beautifulsoup_demo.md : for scraping text from static html (For static html parse)         
Praw_reddit_python_demo.md : Basic python Oauth for reddit api demo (Reddit by Python use case)    

EmailToInstapaper_bulk_python.md : Send a list of url to instapaper for later saved full article to evernote, one by one script in python by Gmail Oauth (For save static html content use)
> For view only, use [todolistTorss](https://rsstodolist.eu/) for newsblur mobile for open in fullpage in panel function for the urls     
> Or you can try https://site-analyzer.pro/soft/batch-url-scraper/ but remember to check for possibility of malicious and better use in sandbox

JINA.gs scrape text for a list of urls with proxy(need authentication api key trim from 3e for real api, btw it is free just in case) and json output https://jina.ai/ (For multiple urls scrape use)    
> Alternatively, use wallabag host in PC   
> Alternatively, use rssodolist with morss.it
>
JINA_GAS.gs using JINA fetch html then use Google appscript to fetch the html through regex (For 403 blocking google appscript politepol and fetchrss and without usable to use)    






   
