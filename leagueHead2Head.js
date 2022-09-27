import { client } from "./lib/common.js";
import { Player } from "./lib/player.js";
import * as fs from 'fs'
import { leagueHeadToHead } from "./lib/leagueHead2Head.js";

if (process.argv.length < 3 ){
    console.log("Need one argument");
    process.exit()
}

var IDs = fs.readFileSync(process.argv[2]).toString('utf-8').replaceAll('\r', '').split('\n');

var players = await Player.createPlayers(client, IDs);

let result = "\\\\\\";
for (let player of players){
    result += '\t' + player.name;
}

let res = await leagueHeadToHead(client, players)

for (let i = 0; i < res.length ; i++){
    let length = res.length
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

fs.writeFileSync('./out.txt', result, (err) => {
    console.error(err);
})