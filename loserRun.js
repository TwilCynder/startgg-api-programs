import { getEventsSetsBasic } from "./include/getEventsSets.js";

import { EventListParser } from "./include/lib/computeEventList.js";
import { OutputModeParser, SingleOptionParser, parseArguments } from "@twilcynder/arguments-parser"; 

import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import fs from 'fs';

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

function addLoserSet(players, user){
    if (!user) return;
    let slug = user.slug;
    if (players[slug]){
        players[slug]++;
    } else {
        players[slug] = 1;  
    }
}

let overallMax = 0
let overallRuns = []

for (let [slug, sets] of Object.entries(data)){
    let players = {};

    for (let set of sets){
        if (set.round < 0){
            addLoserSet(players, set.slots[0].entrant.participants[0].player.user);
            addLoserSet(players, set.slots[1].entrant.participants[0].player.user);
        }
    }

    let max = 0;
    let userSlugs = [];

    Object.entries(players).forEach(([slug, length]) => {
        if (length > max){
            max = length;
            userSlugs = [{slug, length}]
        } else if (length == max) {
            userSlugs.push({slug, length});
        }
    })

    if (max > overallMax){
        overallRuns = [{
            length: max,
            eventSlug: slug,
            userSlugs: userSlugs
        }]
        overallMax = max;
    } else if (max == overallMax){
        overallRuns.push({
            length: max,
            eventSlug: slug,
            userSlugs: userSlugs
        })
    }
}

console.log("Biggest loser run : ", overallMax, "sets :")
for(let run of overallRuns){
    console.log("At", run.eventSlug);
    console.log(run.userSlugs);
}