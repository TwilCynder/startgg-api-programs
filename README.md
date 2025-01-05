# start.gg API Programs

A collection of scripts pulling and presenting data from the start.gg API, with a focus on code factorization making the actual scripts pretty small and easy to expand.    

Each script has a -h/--help option that can be used to get more information about its usage  

- `clutchContest.js` : Checks who had the most last-game sets (sets that went to game x on a BOx) over a list of events. 
- `compareStandings.js` : Compares standings of a list of users in a list of events, checking who got further in the bracket when two players of the list were in the same event. Outputs a matrix of outplacements count for each pair of players.
- `head2head.js` (NEEDS UPDATE) : Checks the direct head to head between two players, i.e. the amount of wins they have on each other
- `leagueHead2Head.js` : Computes direct head to head records for each pair of players in a list.
- `namesearchUsers.js` : Tries to match a list of user names with users that attended a set of events, outputting user slugs for these users. 