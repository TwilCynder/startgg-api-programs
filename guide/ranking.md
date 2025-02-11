# Using startgg-api-programs to help make a ranking

So, you want to make a ranking, but you don't just want an algorithm, you want actual human opinions, and the scripts in this repo can help provide a lot of useful data about the players to help form these opinions. This is how I've been doing it for Toulouse Last Stock. So we're going to use start-api-programs' scripts to produce a spreadsheet that you can give your panelist, with all the data they need.

### Just a few thing worth familirizing with
A **slug** is a short string identifying a element (a user, an event, a game) ; it is usually just the URL for that element's page on startgg but without the "start.gg/" and anything before it. So for example the slug for [this event](https://start.gg/tournament/tls-mad-ness-40/event/1v1-ulimtate) is `tournament/tls-mad-ness-40/event/1v1-ultimate`.   
In some instances you're gonna have to manually provide the "URL or slug" of something ; it means that copy-pasting the URL will be fine, but you can always just use the slug if you want to save text space and keep everything more readable.  

Also, if in a command you see text between `<>`, always replace it, braces included, with what the text is describing. Like, if you see `--start-date <the start date>`, write `--start-date 2024-05-12`, not `--start-date <2024-05-12>`

## TL;DR
- Make an algorithm ranking on braacket or smth, get a list of the top X (X being enough players to include everyone you think has a chance of getting in the final ranking, so for a final Top 20 take the top 40-50 here), copy the list of names in `data/names.txt`
- List your local events (the events that count for your ranking ; if you want to rank them based on their performance in all tournaments they attended during the season, just make a list of events such that all the eligible players have attended at least one)
- Run `node namesearchUsers.js -f slugs.txt --events-file data/localEvents.txt -o data/slugs.txt`
- Check `data/slugs.txt` for "undefined" or "null" lines : you need to fill these slugs yourself (can be found on their startgg page)
- Run `download/downloadUserInfo.js -f data/slugs.txt -o data/users.json`
- Run `node eventsEntered.js -f data/slugs.txt -o data/events.txt --start-date <start of season date> --end-date <end of season date> --format csv -u -b session -b amateur -b ladder -b doubles -b squad-strike -g <game slug> -O`
- Run `node download/downloadEventsStandings.js --events-file data/events.txt -o data/standings.json`. 
- Run `node resultsAtEvents.js -i data/standings.json -D data/users.json -o out/results.csv --eventName --format csv -M 2 -u`   
  If you want two separate lists with local and outside events, instead run : 
    - `node process/filterEvents.js -i data/standings.json --events-file data/localEvents.txt -o data/standingsLocal.json`
    - `node process/filterEvents.js -i data/standings.json -B --events-file data/localEvents.txt -o data/standingsExt.json`
    - `node resultsAtEvents.js -i data/standingsLocal.json -D data/users.json -o out/resultsLocal.csv --eventName --format csv -M 2 -u`
    - `node resultsAtEvents.js -i data/standingsExt.json -D data/users.json -o out/resultsExt.csv --eventName --format csv -M 2 -u`
- In any case, import the CSV(s) into a spreadsheet and remove irrelevant tournaments, then copy the slugs column into `data/events.txt`
- Run `node process/filterEvents.js -i data/standings.json --events-file data/events.txt -o data/standings.json`
- Run `node compareStandings.js -D out/ranking/2024.2/users.json -i out/ranking/2024.2/standings.json -o out/ranking/2024.2/standingsComparison.csv --format csv`
- Run `node leagueHead2Head.js -D data/users.json --events-file data/events.txt -o data/h2h.csv --format csv`
- All the CSV files are your results, put them in a nice spreadheet and give that to your panelists

## Actual guide

### Actually let's make an algo ranking

The first step is, actually, to make an algo ranking, so you can make preliminary list : if you want a Top 20 Ranking, the top 40-50 of any algo ranking will generally include everyone that's going to be on your final, human-made ranking. This will allow us to only fetch data for these 50ish players instead of all your eligible players, which would take a very long time to do. So we're going to make this kind of ranking using a tool like braacket.com, and export the top of this ranking (again, if you want a 20 players ranking, take the top 40 or 50 of your algo ranking).

### List your local events

I assume that this is a local ranking, so you have a list of local tournaments ready. You can start by making a list of these events slugs, or URLs : put that list in a text file, that we're gonna call `data/localEvents.txt` for the sake of this guide (one url per line).    
If you have a bunch of events for which only a number change (For example if you have a weekly or monthly tournament that's always called My Weekly #(number), always with the same event name), you can replace the number with a %, and add a min and max number at the end of the line. For example, including `tournament/my-weekly-%/event/ultimate-singles 1 10` is the same as including `tournament/my-weekly-1/event/ultimate-singles`, `tournament/my-weekly-2/event/ultimate-singles` and so on until my-weekly-10.

### Finding your players slugs

Now, to start fetching data about the players, we have to get their start.gg user slug ; and whatever you use for your algo ranking, it probably won't give you that, only their display name. And getting a slug from a display name is really annoying.  
We have a script to help for that : start by putting the names of your players in a text file (one per line, you can just copy the list from a spreadsheet) that we'll call `data/names.txt`. 
For example, braacket gives you a csv, you can import that on your final spreadsheet (since this ralgo ranking is already a good base for the ranking, so might as well include it in the result), and copy-paste the names column into the text file.  

Now run `node namesearchUsers.js -f slugs.txt --events-file data/localEvents.txt -o data/slugs.txt` to search for the names among these users.  
`data/slugs.txt` should now contain a list of start.gg user slugs. Note that some might be absent ("undefined" instead of "user/something"), if they have renamed and the name in the algo ranking was not their current start.gg name (happens a lot with braacket unfortunately). In this case, you have to look for their slug and enter it in `data/slugs.txt` by hand ; you can find it in their start.gg user page (in the URL or next to their name)

Once you've got all your users slugs, run :  
`download/downloadUserInfo.js -f data/slugs.txt -o data/users.json`

### Checking all the events they entered during the season
Now, we want to know all the events they entered during the season. To fetch that, use `node eventsEntered.js -f data/slugs.txt -o data/events.txt --start-date <start of season date> --end-date <end of season date> --format csv -u`, with the appropriate dates, in the yyyy-mm-dd format.   
If you only want events running a specific game (and I'm pretty sure you want), you can add `-g <game slug or URL>` ; the url is tat of the game's page on start.gg (search for the game in start.gg's search bar)  
You can also filter events using some blacklisted words, by adding `-b <filtered word>`. For example, you can use `-b session -b amateur -b ladder` to filter session bracket, ladders and amateur brackets (or at least, events with these words in their names), which you usually don't want in a ranking data.  
Finally `-O` removes online events.

### Getting results
So, we have a list of event we want to get data from.  
Now run
- `node download/downloadEventsStandings.js --events-file data/events.txt -o data/standings.json`. 
- `node resultsAtEvents.js -i data/standings.json -D data/users.json -o out/results.csv --eventName --format csv -M 2 -u`  

`out/results.csv` now contains a table of all the events featuring at least two of your players, with their results. For readability, you might want to import it to a spreadsheet program like Google Sheets.  
Note that you might still have "useless" events that escaped the previous filters, so you might want to remove them manually.  

Once you've filtered your events, copy the "slug" collumn into `data/events.txt`. 

#### Going further
For clarity, it's sometimes good to give two list of results to the panelists : one for the local events, one for the other events (some ranking panels tend to treat them differently).  

To do that run : 
- `node process/filterEvents.js -i data/standings.json --events-file data/localEvents.txt -o data/standingsLocal.json`
- `node process/filterEvents.js -i data/standings.json -B --events-file data/localEvents.txt -o data/standingsExt.json`
- `node resultsAtEvents.js -i data/standingsLocal.json -D data/users.json -o out/resultsLocal.csv --eventName --format csv -M 2 -u`
- `node resultsAtEvents.js -i data/standingsExt.json -D data/users.json -o out/resultsExt.csv --eventName --format csv -M 2 -u`

You have your lists in `data/resultsLocal.csv` and `data/resultsExt.csv`. Now, don't forget to curate the list of ext results, and copy both the slug columns into `data/events.txt`

### Comparing players
Before moving on, if we manually removed events from the result table(s) in the previous step, we need to remove them in the data we downloaded :  
`node process/filterEvents.js -i data/standings.json --events-file data/events.txt -o data/standings.json`  

Now run 
- `node compareStandings.js -D data/users.json -i data/standings.json -o data/standingsComparison.csv --format csv`
- `node leagueHead2Head.js -D data/users.json --events-file data/events.txt -o data/h2h.csv --format csv`

`data/standingsComparison.csv` and `data/h2h.csv` contain comparison tables, that you can also put in a spreadhseet.  