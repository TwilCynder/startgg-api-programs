import { EventListParser } from "./include/lib/computeEventList.js";
import { OutputModeParser, SingleOptionParser, parseArguments } from "@twilcynder/arguments-parser"; 

import { client } from "./include/lib/common.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";

import fs from 'fs';
import { Query } from "./include/lib/query.js";
import { readSchema } from "./include/lib/lib.js";
import { getSetsInEvent } from "./include/getSetsInEvents.js";

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
    let query = new Query(readSchema(import.meta.url, "../include/GraphQLSchemas/EventSetsGames.txt"))
    data = await getSetsInEvent(client, query, slugs, limiter);
}

function detectReverse(games){
    if (games.length < 5) return false;
    let winnerChangeCounter = 0;
    let previousWinnerId = games[0].winnerId;
    for (let game of games){
        if (game.winnerId != previousWinnerId){
            winnerChangeCounter++;
            previousWinnerId = game.winnerId;
        }
    }
    return winnerChangeCounter == 1 ? previousWinnerId : false;
}

let players = {}

function addReverse(id){
    if (players[id]){
        players[id]++;
    } else {
        players[id] = 1
    }
}

for (let set of data){
    if (!set.games){
        continue;
    }
    let reverseId = detectReverse(set.games);

    if (reverseId){
        console.log("REVERSE")
        if (reverseId == set.slots[0].entrant.id) addReverse(set.slots[0].entrant.participants[0].player.id)
        else if (reverseId == set.slots[1].entrant.id) addReverse(set.slots[1].entrant.participants[0].player.id) 
        else console.error("WINNER ID DOESNT MATCH ANY OF THE ENTRANTS WHAT THE FUCK");
    }
}

console.log(players);

players = Object.entries(players).sort(([ida, valueA], [idb, valueB]) => valueA - valueB).slice(-10);

for (let [id, value] of players){
    console.log(id, value);
}

limiter.stop();