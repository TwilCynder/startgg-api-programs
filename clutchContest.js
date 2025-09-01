import { getEventsSetsBasic } from "./include/getEventsSets.js";

import { addEventParsers, readEventLists } from "./include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { StartGGDelayQueryLimiter } from "startgg-helper";
import { createClient  } from "startgg-helper-node";

import { getPlayerName } from "./include/getPlayerName.js";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { output, readMultimodalArrayInput } from "./include/lib/util.js";
import { yellow } from "./include/lib/consoleUtil.js";

let {eventSlugs, eventsFilenames, outputFormat, outputfile, logdata, printdata, inputfile, stdinput, silent, names, top, min_sets} = new ArgumentsManager()
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

eventSlugs = await readEventLists(eventSlugs, eventsFilenames)

let client = createClient();
let limiter = new StartGGDelayQueryLimiter();

let data = await readMultimodalArrayInput(inputfile, stdinput, 
    eventSlugs.length > 0 ? getEventsSetsBasic(client, eventSlugs, limiter): null
)

data = data.reduce( (prev, curr) => {
    return curr ? prev.concat(curr) : prev;
}, []);


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

    addSet(set.slots[0].entrant.participants[0].user, clutch);
    addSet(set.slots[1].entrant.participants[0].user, clutch);
}

/**
 * @type {{sets: number, clutchs: number, average: number, slug: string, name: string}[]}
 */
let playerList = Object.entries(players).map(([id, player]) => {
    player.average = player.clutchs / player.sets;
    player.slug = id;
    player.name = id;
    return player;
}).filter(player => player.sets > min_sets);

let totalList = playerList.sort((a, b) => b.clutchs - a.clutchs).slice(0, top);
let averageList = playerList.sort((a, b) => b.average - a.average).slice(0, top);

//console.log(totalList.length, averageList.length, top);

//process.exit(0);

if (names){
    if (top){
        await Promise.all(totalList.concat(averageList).map(player =>
            getPlayerName(client, player.slug, limiter).then(name => {
                player.name = name;
            })
        ))
    } else {
        await Promise.all(playerList.map(player =>
            getPlayerName(client, player.slug, limiter).then(name => {
                player.name = name;
            })
        ));
    } 
}

limiter.stop();

if (silent_) unmuteStdout();

if (logdata_){
    console.log("====== TOTAL ======")
    for (let player of totalList){
        console.log(player.name, ":", player.clutchs, `(${yellow(player.average.toFixed(2))} average) out of ${yellow(player.sets)}`)
    }
    console.log("====== AVERAGE ======")
    for (let player of averageList){
        console.log(player.name, ":", yellow(player.average.toFixed(2)), `(${yellow(player.clutchs)} total out of ${yellow(player.sets)})`)
    }
}

output(outputFormat, outputfile, printdata, playerList, (players) => {
    let str = "";
    for (let player of players){
        str += `${player.name}\t${player.slug}\t${player.clutchs}\t${player.sets}\t${player.average}\n`
    }
    return str;
})
