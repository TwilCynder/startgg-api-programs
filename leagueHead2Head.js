import { client } from "./include/lib/client.js";
import { User } from "./include/user.js";
import * as fs from 'fs'
import { leagueHeadToHead } from "./include/leagueHead2Head.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";

if (process.argv.length < 3 ){
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " IDsListFilename [timestamp]");
    process.exit()
}

var IDs = fs.readFileSync(process.argv[2]).toString('utf-8').replaceAll('\r', '').split('\n');

var begin = null;
if (process.argv.length > 3){
    begin = parseInt(process.argv[3]);
}

var end = null;
if (process.argv.length > 4){
    end = parseInt(process.argv[4]);
}

var limiter = new StartGGDelayQueryLimiter;

//var players = await Player.createPlayers(client, IDs);
var users = await User.createUsers(client, slugs, limiter);

let result = "\\\\\\";
for (let player of players){
    result += '\t' + player.name;
}

let res = await leagueHeadToHead(client, players, begin, end)

for (let i = 0; i < res.length ; i++){
    result+= '\n' + players[i].name
    for (let j = 0; j < res.length; j++){
        console.log(i, j)
        if (i == j){
            result += '\tXXXX'
        } else if (i < j){
            let h2h = res[i][j - i - 1]
            result += '\t' + h2h[0].score + " - " + h2h[1].score
        } else if (i > j){
            let h2h = res[j][i - j - 1]
            result += '\t' + h2h[1].score + " - " + h2h[0].score
        }
    }
}

console.log(result);

fs.mkdir('out', () => {});
fs.writeFileSync('./out/leagueHead2Head.txt', result, (err) => {
    console.error(err);
})