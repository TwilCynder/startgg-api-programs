## Using startgg-api-programs to help make a ranking

So, you want to make a ranking, but you don't just want an algorithm, you want actual human opinions, and the scripts in this repo can help provide a lot of useful data about the players to help form these opinions. This is how I've been doing it for Toulouse Last Stock. So we're going to use start-api-programs' scripts to produce a spreadsheet that you can give your panelist, with all the data they need.

### Just a few thing worth familirizing with
A **slug** is a short string identifying a element (a user, an event, a game) ; it is usually just the URL for that element's page on startgg but without the "start.gg/" and anything before it. So for example the slug for [this event](https://start.gg/tournament/tls-mad-ness-40/event/1v1-ulimtate) is `tournament/tls-mad-ness-40/event/1v1-ultimate`.   
In some instances you're gonna have to manually provide the "URL or slug" of something ; it means that copy-pasting the URL will be fine, but you can always just use the slug if you want to save text space and keep everything more readable.  

Also, if in a command you see text between `<>`, always replace it, braces included, with what the text is describing. Like, if you see `--start-date <the start date>`, write `--start-date 2024-05-12`, not `--start-date <2024-05-12>`

### Actually let's make an algo ranking

The first step is, actually, to make an algo ranking, so you can make preliminary list : if you want a Top 20 Ranking, the top 40-50 of any algo ranking will generally include everyone that's going to be on your final, human-made ranking. This will allow us to only fetch data for these 50ish players instead of all your eligible players, which would take a very long time to do. So we're going to make this kind of ranking using a tool like braacket.com, and export the top of this ranking (again, if you want a 20 players ranking, take the top 40 or 50 of your algo ranking).

### List your lccal events

I assume that this is a local ranking, so you have a list of local tournaments ready. You can start by making a list of these events slugs, or URLs : put that list in a text file, that we're gonna call `data/events.txt` for the sake of this guide (one url per line).    
If you have a bunch of events for which only a number change (For example if you have a weekly or monthly tournament that's always called My Weekly #(number), always with the same event name), you can replace the number with a %, and add a min and max number at the end of the line. For example, including `tournament/my-weekly-%/event/ultimate-singles 1 10` is the same as including `tournament/my-weekly-1/event/ultimate-singles`, `tournament/my-weekly-2/event/ultimate-singles` and so on until my-weekly-10.

### Finding your players slugs

Now, to start fetching data about the players, we have to get their start.gg user slug ; and whatever you use for your algo ranking, it probably won't give you that, only their display name. And getting a slug from a display name is really annoying.  
We have a script to help for that : start by putting the names of your players in a text file (one per line, you can just copy the list from a spreadsheet) that we'll call `data/names.txt`. 
For example, braacket gives you a csv, you can import that on your final spreadsheet (since this ralgo ranking is already a good base for the ranking, so might as well include it in the result), and copy-paste the names column into the text file.  

Now :
- run `node download/downloadEventsUniqueUsers.js --events-file data/events.txt -o data/uniqueUsers.json` to get a list of users who attended your events
- run `node namesearchUsers.js -f slugs.txt -i data/uniqueUsers.json -o data/slugs.txt` to search for the names among these users
`data/slugs.txt` should now contain a list of start.gg user slugs. Note that some might be absent ("undefined" instead of "user/something"), if they have renamed and the name in the algo ranking was not their current start.gg name (happens a lot with braacket unfortunately). In this case, you have to look for their slug and enter it in `data/slugs.txt` by hand ; you can find it in their start.gg user page (in the URL or next to their name)

Now that you have your users slugs, you can start fetching data about their performance. You just need to decide one thing : do you want to know how they performed only in your tournaments, or in all the tournaments they attended during the season ? If you only want to take your tournaments in account, keep the even list you made earlier (`data/localEvents.txt`) ; ou can rename it `data/events.txt` and skip the next part. 

### Checking all the events they entered during the season
So, we want all the events they entered during the ranking's season. To fetch that, use `node eventsEntered.js -f data/slugs.txt -o out/events.txt --start_date <start of season date> --end_date <end of season date> --format csv -u`, with the appropriate dates, in the yyyy-mm-dd format.   
If you only want events running a specific game (and I'm pretty sure you want), you can add `-g <game slug or URL>` ; the url is tat of the game's page on start.gg (search for the game in start.gg's search bar)  
You can also filter events using some blacklisted words, by adding `-b <filtered word>`. For example, you can use `-b session -b amateur -b ladder` to filter session bracket, ladders and amateur brackets (or at least, events with these words in their names), which you usually don't want in a ranking data.

### Getting data
So, we have a list of event we want to get data from.  
Let's first run `node download/downloadEventsStandings.js --events-file data/events.txt -o data/standings.json`. 