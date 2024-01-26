import { getEventsSetsBasic } from "./include/getEventsSets.js";

import { EventListParser } from "./include/lib/computeEventList.js";
import { OutputModeParser, SingleOptionParser, parseArguments } from "@twilcynder/goombalib-js"; 

import { client } from "./include/lib/common.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";

import fs from 'fs';
import { getPlayerName } from "./include/getPlayerName.js";

let [outputMode, inputFile, slugs] = parseArguments(process.argv.slice(2), 
    new OutputModeParser("log", "casseur2bracket"),
    new SingleOptionParser("-f"),
    new EventListParser()
)

let data;
let limiter = new StartGGDelayQueryLimiter();

if (inputFile){
    data = fs.readFileSync(inputFile).toString();
    data = JSON.parse(data);
    console.log("Finished reading data from file");
} else {
    data = await getEventsSetsBasic(client, slugs, limiter);
}

let players = {}
function addSet(user, clutch){
    if (!user) return;
    let id = user.slug;

    if (players[id]){
        players[id].sets++;
        players[id].clutchs += clutch;
    } else {
        players[id] = {
            sets: 1,
            clutchs: 0 + clutch
        }
    }
}

for (let set of data){
    let score1 = set.slots[0].standing.stats.score.value;
    let score2 = set.slots[1].standing.stats.score.value;

    if (score1 < 0 || score2 < 0) continue;

    let clutch = Math.abs(score1 - score2) == 1

    addSet(set.slots[0].entrant.participants[0].player.user, clutch);
    addSet(set.slots[1].entrant.participants[0].player.user, clutch);
}

players = Object.entries(players).map(([id, player]) => {
    player.average = player.clutchs / player.sets;
    player.slug = id;
    return player;
}).filter(player => player.sets > 10).sort((a, b) => a.average - b.average).slice(-10);
await Promise.all(players.map(player =>
    getPlayerName(client, player.slug, limiter).then(name => {
        player.name = name;
    })
))

for (let player of players){
    console.log(player.name, player.average, player.clutchs, player.sets);
}

limiter.stop();