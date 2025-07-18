import { addEventParsers, readEventLists } from "./include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { output, readMultimodalInput } from "./include/lib/util.js";
import { getEventsSetsGames } from "./include/getEventsSetsGames.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { yellow } from "./include/lib/consoleUtil.js";

let {eventSlugs, eventsFilenames, outputFormat, outputfile, logdata, printdata, inputfile, stdinput, silent, top, min_sets} = new ArgumentsManager()
    .apply(addEventParsers)
    .apply(addInputParams)
    .apply(addOutputParams)
    .addSwitch(["-a", "--names"], {description: "Fetch players names (to use in human-readable instead of ID). True by default"})
    .addOption(["-n", "--number"], {description: "How many players to display in human-readbale result", type: "number"})
    .addOption(["-m", "--min_sets"], {description: "Minimum number of sets to be included in the results", type: "number", default: 10})
    .addOption(["-t", "--top"], {description: "Display only this many players"})
    .enableHelpParameter()
    .parseProcessArguments();

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();


let events = await readEventLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter();
let data = await readMultimodalInput(inputfile, stdinput, getEventsSetsGames(client, events, limiter));
limiter.stop();

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

function addSet(player){
    if (!player) {
        console.warn("No player")
        return
    }
    let id = player.id;
    if (players[id]){
        players[id].sets++;
    } else {
        players[id] = {sets: 1, reverses: 0, name: player.gamerTag}
    }
}

function addReverse(player){
    if (!player) {
        console.warn("No player");
        return
    }
    players[player.id].reverses++;
}

for (let set of data){
    if (!set.games){
        continue;
    }

    let p1 = set.slots[0].entrant.participants[0].player;
    let p2 = set.slots[1].entrant.participants[0].player;
    addSet(p1);
    addSet(p2);

    let reverseId = detectReverse(set.games);
    if (reverseId){
        console.log("REVERSE")

        if (reverseId == set.slots[0].entrant.id) addReverse(p1)
        else if (reverseId == set.slots[1].entrant.id) addReverse(p2) 
        else console.error("WINNER ID DOESNT MATCH ANY OF THE ENTRANTS WHAT THE FUCK");
    }
}

console.log(players);

/**
 * @type {{sets: number, reverses: number, average: number, name: string}[]}
 */
let playerList = Object.entries(players).map(([id, player]) => {
    player.average = player.reverses / player.sets;
    return player;
}).filter(player => player.sets > min_sets);

console.log(playerList)

let totalList = playerList.sort((a, b) => b.reverses - a.reverses).slice(0, top);
let averageList = playerList.sort((a, b) => b.average - a.average).slice(0, top);

if (silent_) unmuteStdout();

if (logdata_){
    console.log("====== TOTAL ======")
    for (let player of totalList){
        console.log(player.name, ":", player.reverses, `(${yellow(player.average.toFixed(2))} average) out of ${yellow(player.sets)}`)
    }
    console.log("====== AVERAGE ======")
    for (let player of averageList){
        console.log(player.name, ":", yellow(player.average.toFixed(2)), `(${yellow(player.reverses)} total out of ${yellow(player.sets)})`)
    }
}

output(outputFormat, outputfile, printdata, playerList, (players) => {
    let str = "";
    for (let player of players){
        str += `${player.name}\t${player.reverses}\t${player.sets}\t${player.average}\n`
    }
    return str;
})