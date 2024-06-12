import { getEventSetsBasic, getEventsSetsBasic } from "./include/getEventsSets.js";

import { EventListParser } from "./include/lib/computeEventList.js";
import { OutputModeParser, parseArguments } from "@twilcynder/arguments-parser"; 

import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { getDoubleEliminationUpsetFactorFromSet } from "./include/lib/tournamentUtil.js";

let [outputMode, slugs] = parseArguments(process.argv.slice(2), 
    new OutputModeParser("log", "casseur2bracket"),
    new EventListParser()
)

let limiter = new StartGGDelayQueryLimiter();
let data = await getEventsSetsBasic(client, slugs, limiter);

let players = {}
function addUpset(user, value, name, opponentName){
    if (!user) return;
    console.log("------- ADD --------")
    console.log(name, opponentName, user.id);
    let id = user.id;
    if (players[id]){
        players[id].upsets.push({opponent: opponentName, spr: value});
        players[id].sets++;
    } else {
        players[id] = {name, upsets : [{opponent: opponentName, spr: value}], sets: 1};
    }
}   

function addSet(user, name){
    if (!user) return;
    let id = user.id;
    if (players[id]){
        players[id].sets++;
    } else {
        players[id] = {name, upsets: [], sets: 1};
    }
}

console.log("Data fetched, ${data.length} sets");

for (let set of data){
    let [spr, winner] = getDoubleEliminationUpsetFactorFromSet(set);

    let winnerEntrant = set.slots[winner].entrant;
    let loserEntrant = set.slots[1 - winner].entrant;

    if (spr > 0){
        console.log("NON NULL SPR", spr)
        console.log(set.slots[winner].entrant.name, set.slots[1 - winner].entrant.name);
        addUpset(winnerEntrant.participants[0].player.user, spr, winnerEntrant.name, loserEntrant.name);
        addUpset(loserEntrant.participants[0].player.user, -spr, loserEntrant.name, winnerEntrant.name);
    } else {
        addSet(winnerEntrant.participants[0].player.user, winnerEntrant.name);
        addSet(loserEntrant.participants[0].player.user, loserEntrant.name);
    }
}   

players = Object.entries(players).map( ([id, player]) => {
    let sum = 0;
    let sumPos = 0;
    for (let set of player.upsets){
        sum += Math.abs(set.spr);
        if (set.spr > 0) sumPos += set.spr;
    }
    player.total = sum;
    player.totalPos = sumPos;
    player.average = sum / player.sets;
    player.averagePos = sumPos / player.sets;
    return player;
});

console.log("===== TOTAL VALUE =====")
players.sort((a, b) => a.total - b.total)
for (let player of players.slice(-3)){
    console.log("-------------");
    console.log(player.name);
    //console.log(player.upsets);
    for (let set of player.upsets){
        console.log(set.opponent, set.spr);
    }
    console.log(player.total);
}

console.log("===== AVERAGE =====")
players.sort((a, b) => b.average - a.average);
let count = 0;
for (let player of players){
    if (player.sets < 10) continue;
    count++;
    console.log(player.name, player.average, player.upsets.length, player.sets);

    if (count == 5) break;
}

console.log("===== TOTAL VALUE POSITIVE =====")
players.sort((a, b) => a.totalPos - b.totalPos)
for (let player of players.slice(-3)){
    console.log("-------------");
    console.log(player.name);
    //console.log(player.upsets);
    for (let set of player.upsets){
        if (set.spr > 0)
        console.log(set.opponent, set.spr);
    }
    console.log(player.totalPos);
}

console.log("===== AVERAGE POSITIVE =====")
players.sort((a, b) => b.averagePos - a.averagePos)
count = 0;
for (let player of players){
    if (player.sets < 10) continue;
    count++;
    console.log(player.name, player.averagePos, player.upsets.length, player.sets);

    if (count == 5) break;
}

limiter.stop();
