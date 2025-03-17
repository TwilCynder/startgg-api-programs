import { getEventsSetsBasic } from "./include/getEventsSets.js";

import { addEventParsers, EventListParser, readEventLists } from "./include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";

import { getPlayerName } from "./include/getPlayerName.js";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { muteStdout, readJSONInput, unmuteStdout } from "./include/lib/jsUtil.js";
import { readJSONFromStdin } from "./include/lib/loadInput.js";
import { output } from "./include/lib/util.js";

let {eventSlugs, eventsFilenames, outputFormat, outputfile, logdata, printdata, inputfile, stdinput, silent, names, number, min_sets} = new ArgumentsManager()
    .apply(addEventParsers)
    .apply(addInputParams)
    .apply(addOutputParams)
    .addSwitch(["-a", "--names"], {description: "Fetch players names (to use in human-readable instead of ID). True by default"})
    .addOption(["-n", "--number"], {description: "How many players to display in human-readbale result", type: "number"})
    .addOption(["-m", "--min_sets"], {description: "Minimum number of sets to be included in the results", type: "number", default: 10})
    .parseProcessArguments();

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

eventSlugs = await readEventLists(eventSlugs, eventsFilenames)

let limiter = new StartGGDelayQueryLimiter();

let data = await Promise.all([
    inputfile ? 
        readJSONInput(inputfile).catch(err => {
            console.warn(`Could not open file ${inputfile} : ${err}`)
            return [];
        }) 
    : null,
    stdinput ? readJSONFromStdin() : null,
    slugs.length > 0 ?
        getEventsSetsBasic(client, eventSlugs, limiter)
    : null
])
data = data.reduce( (prev, curr) => {
    return curr ? prev.concat(curr) : prev;
}, []);

/*
if (inputfile){
    data = fs.readFileSync(inputfile).toString();
    data = JSON.parse(data);
    console.log("Finished reading data from file");
} else {
    data = await getEventsSetsBasic(client, slugs, limiter);
}
*/

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
    return player;
}).filter(player => player.sets > min_sets).sort((a, b) => a.average - b.average).slice(-number);

if (names){
    await Promise.all(playerList.map(player =>
        getPlayerName(client, player.slug, limiter).then(name => {
            player.name = name;
        })
    ))
} else {
    playerList.forEach(player => player.name = player.slug)
}

limiter.stop();


if (silent_) unmuteStdout();

if (logdata_){
    for (let player of playerList){
        console.log(player.name, player.average.toFixed(2), player.clutchs, player.sets);
    }
}

output(outputFormat, outputfile, printdata, playerList, (players) => {
    let str = "";
    for (let player of players){
        str += `${player.name}\t${player.slug}\t${player.clutchs}\t${player.sets}\t${player.average}\n`
    }
})

limiter.stop();