import { getPlayersNames } from "./include/getPlayerName.js";
import { client } from "./include/lib/common.js";
import * as fs from 'fs';

if (process.argv.length < 3 ){
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " IDsListFilename");
    process.exit()
}

var IDs = fs.readFileSync(process.argv[2]).toString('utf-8').replaceAll('\r', '').split('\n');

var players = await getPlayersNames(client, IDs);

console.log(players.length);
let i = 1;
for (let p of players){
    console.log(i, p.user ? p.user.player.gamerTag : p)
    i ++;
}