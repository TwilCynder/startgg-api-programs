import { getEventsSetsBasic } from "./include/getEventsSets.js";

import { EventListParser } from "./include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";

import { getPlayerName } from "./include/getPlayerName.js";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { muteStdout, readJSONAsync, unmuteStdout } from "./include/lib/lib.js";
import { loadInputFromStdin } from "./include/lib/loadInput.js";
import { output } from "./include/lib/util.js";

let {slugs, outputFormat, outputfile, logdata, printdata, inputfile, stdinput} = new ArgumentsManager()
    .addCustomParser(new EventListParser, "slugs")
    .apply(addInputParams)
    .apply(addOutputParams)
    .parseProcessArguments();

let [log, silent] = doWeLog(logdata, printdata, outputfile, silent);

if (silent) muteStdout();

let limiter = new StartGGDelayQueryLimiter();

let data = await Promise.all([
    inputfile ? 
        readJSONAsync(inputfile).catch(err => {
            console.warn(`Could not open file ${inputfile} : ${err}`)
            return [];
        }) 
    : null,
    stdinput ? loadInputFromStdin() : null,
    slugs.length > 0 ?
        getEventsSetsBasic(client, slugs, limiter)
    : null
])
data = data.reduce( (prev, curr) => {
    return curr ? prev.concat(curr) : prev;
}, []);

console.log(data.length);

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

    addSet(set.slots[0].entrant.participants[0].player.user, clutch);
    addSet(set.slots[1].entrant.participants[0].player.user, clutch);
}

/**
 * @type {{sets: number, clutchs: number, average: number, slug: string, name: string}[]}
 */
let playerList = Object.entries(playerList).map(([id, player]) => {
    player.average = player.clutchs / player.sets;
    player.slug = id;
    return player;
}).filter(player => player.sets > 10).sort((a, b) => a.average - b.average).slice(-10);

await Promise.all(playerList.map(player =>
    getPlayerName(client, player.slug, limiter).then(name => {
        player.name = name;
    })
))

if (silent) unmuteStdout();

if (logdata){
    for (let player of playerList){
        console.log(player.name, player.average, player.clutchs, player.sets);
    }
}

output(outputFormat, outputfile, printdata, playerList, (players) => {
    let str = "";
    for (let player of players){
        str += `${player.name}\t${player.slug}\t${player.clutchs}\t${player.sets}\t${player.average}\n`
    }
})

limiter.stop();