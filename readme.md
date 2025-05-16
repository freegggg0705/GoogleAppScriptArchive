rss1.gs : RSS feed append only , not refreshing old items record , dynamic column creating, google create date creating (For append use)    
rss2.gs : Preset column amount, sort by third column, and de-duplicate by second column, no google create date ( For append use )   

api1.gs: dynamic column, with google create date, sort by google create date latest to oldest , remove duplicate by string(thread_id), decode hex for chinese (Update old entires use) 
  
api2.gs : With authentication,with endpoint params config, dynamic column with google create date, sort by google create date, remove duplicate (Update old entires use with Oauth and endpoints param)          

redditapi.gs : sort by google create date from latest to oldest , remove duplicate, recursion for non duplicate item until maxattempt (Update old entires use) (multireddit available) 

redditapi2.gs : aggregate multiple subreddit parse, just stack no sort and de-duplication, yellow line to split every retrieval, list can have only 1 item (Append use)     

multiredditapi.gs: multireddit by default, yellow line split, no sort and de-duplicate (Append use only) (subreddit available)




   
