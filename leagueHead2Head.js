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

await leagueHeadToHead(client, players)