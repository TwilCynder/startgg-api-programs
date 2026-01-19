import { getEventsSetsBasic } from "./include/getEventsSets.js";

import { addEventParsers, readEventLists } from "./include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { getDoubleEliminationUpsetFactorFromSet } from "startgg-helper";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { columns, output, readMultimodalArrayInput } from "./include/lib/util.js";
import { yellow } from "./include/lib/consoleUtil.js";

let {eventSlugs, eventsFilenames, top, min_sets, sprRange, inputfile, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
    .apply(addOutputParams)
    .apply(addInputParams)
    .apply(addEventParsers)
    .addOption(["-t", "--top"], {description: "Display the top x players in the logs (does not affect the data output)", default: 3, type: "number"})
    .addOption("--min-sets", {description: "Minimum amount of sets to be counted in the average spr ranking", default: 20, type: "number", dest: "min_sets"},)
    .addOption(["--spr-range"], {description: "Number of SPRs to include in the biggest upset result ; by default, only the top one is displayed", type: "number", dest: "sprRange", default: 1})
    .enableHelpParameter()

    .parseProcessArguments()

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let events = await readEventLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter();
let data = await readMultimodalArrayInput(inputfile, getEventsSetsBasic(client, events, limiter));
limiter.stop();

console.log(`Data fetched, ${data.length} sets`);

let players = {}

if (sprRange < 1) sprRange = 1;
let biggestUpsets = {spr: 0, matches: []};

function newPlayer(name, upsets){
    return {name, upsets : upsets, sets: 1, upsetsPosNb: 0}
}

function addUpset(player, value, opponentName){
    if (!player) {
        console.warn("No player !", opponentName);
    };
    let name = player.gamerTag;

    let id = player.id;
    if (players[id]){
        players[id].upsets.push({opponent: opponentName, spr: value});
        players[id].sets++;
    } else {
        players[id] = newPlayer(name, [{opponent: opponentName, spr: value}]);
    }

    if (value > 0){
        players[id].upsetsPosNb++;
    }
}   

function addSet(player){
    if (!player) {
        console.warn("No player !", opponentName);
    };
    let name = player.gamerTag;

    let id = player.id;
    if (players[id]){
        players[id].sets++;
    } else {
        players[id] = newPlayer(name, []);
    }
}

for (let set of data){
    //console.log(set.slots[0].entrant.participants[0].player.gamerTag, set.slots[1].entrant.participants[0].player.gamerTag, set.slots[0].standing.stats.score.value, set.slots[1].standing.stats.score.value)
    let [spr, winner] = getDoubleEliminationUpsetFactorFromSet(set);
    let winnerPlayer = set.slots[winner].entrant.participants[0].player;
    let loserPlayer = set.slots[1 - winner].entrant.participants[0].player;

    if (spr > 0){
        addUpset(winnerPlayer, spr, loserPlayer.gamerTag);
        addUpset(loserPlayer, -spr, winnerPlayer.gamerTag);

        if (spr > biggestUpsets.spr - sprRange){
            biggestUpsets.matches.push({p1: winnerPlayer.gamerTag, p2: loserPlayer.gamerTag, spr});
            if (spr > biggestUpsets.spr) biggestUpsets.spr = spr;
        } 
    } else {
        addSet(winnerPlayer);
        addSet(loserPlayer);
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

if (silent_) unmuteStdout();

if (logdata_){

    console.log("======= TOTAL VALUE =======")
    players.sort((a, b) => a.total - b.total)
    for (let player of players.slice(-top)){
        console.log("Player :", player.name);
        for (let set of player.upsets){
            console.log("-", set.opponent, set.spr);
        }
        console.log("-> Total :", player.total);
    }
    
    console.log("===== AVERAGE =====")
    players.sort((a, b) => b.average - a.average);
    let count = 0;
    for (let player of players){
        if (player.sets < min_sets) continue;
        count++;
        console.log(player.name, " ; average SPR : ", yellow(player.average.toFixed(2)), ";", `${yellow(player.upsets.length)} upsets out of ${yellow(player.sets)} matches`)
    
        if (count == top) break;
    }
    
    console.log("===== TOTAL VALUE POSITIVE =====")
    players.sort((a, b) => a.totalPos - b.totalPos)
    for (let player of players.slice(-top)){
        console.log("Player :", player.name);
        for (let set of player.upsets){
            if (set.spr > 0) console.log("-", set.opponent, set.spr);

        }
        console.log("-> Total :", player.total);
    }
    
    console.log("===== AVERAGE POSITIVE =====")
    players.sort((a, b) => b.averagePos - a.averagePos)
    count = 0;
    for (let player of players){
        if (player.sets < min_sets) continue;
        count++;
        console.log(player.name, " ; average SPR : ", yellow(player.averagePos.toFixed(2)), ";", `${yellow(player.upsetsPosNb)} upsets out of ${yellow(player.sets)} matches`)
    
        if (count == top) break;
    }

    console.log("===== BIGGEST UPSETS ======");
    biggestUpsets.matches.sort((a, b) => b.spr - a.spr);
    let currentSPR = Infinity
    for (let match of biggestUpsets.matches){
        let spr = match.spr;
        if (spr < currentSPR){
            if (spr < biggestUpsets.spr - sprRange + 1) break;
            console.log("SPR :", spr);
            currentSPR = spr;
        }
        console.log("-", match.p1, "-", match.p2);
    }
}

output(outputFormat, outputfile, printdata, players, players => {
    let res = "";
    for (let player of players){
        res += columns(
            player.name, 
            player.total, 
            player.average.toFixed(2), 
            player.upsets.length, 
            player.totalPos, 
            player.averagePos.toFixed(2), 
            player.upsetsPosNb,
            player.sets) + '\n';
    }
    return res;
})