import { addInputParams, addOutputParams, argumentsManager, doWeLogFromArgs } from "./include/lib/paramConfig.js";
import { addEventParsers, readEventSlugsLists } from "./include/lib/computeEventList.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { columnsln, outputFromArgs, readMultimodalArrayInput } from "./include/lib/util.js";
import { getEventsSetsBasicHashmap } from "./include/getEventsSets.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

//TODO : ajouter un système de range comme pour les upsets
let {eventSlugs, eventsFilenames, loserOnly, inputfile, allArgs} = argumentsManager()
    .apply(addInputParams)
    .apply(addOutputParams)
    .apply(addEventParsers)
    .addSwitch(["-L", "--loser-only"], {description: "Only count loser runs", dest: "loserOnly"})
    .enableHelpParameter()
    .parseProcessArguments()

let [logdata, silent] = doWeLogFromArgs(allArgs);

if (silent) muteStdout()

let events = await readEventSlugsLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter()
let data = await readMultimodalArrayInput(inputfile, getEventsSetsBasicHashmap(client, events, limiter))
limiter.stop();

let best = {maxLength: 0, runs: []}
let names = {};
for (let [evSlug, sets] of data){
    if (!sets) continue;
    let runsLocal = {};
    for (let set of sets){
        if (set.round > 0 && loserOnly) continue; //we want loser runs
        for (let slot of set.slots){
            let player = slot.entrant.participants[0].player;
            let id = player.id;
            if (!names[id]) names[id] = player.gamerTag;

            if (runsLocal[id]){
                runsLocal[id]++;
            } else {
                runsLocal[id] = 1
            }
        }
    }

    let list = Object.entries(runsLocal);
    if (list.length < 1) continue;

    let max = 0;
    list.forEach(([_, val]) => {if (val > max) max = val});

    if (max > best.maxLength){
        best.maxLength = max;
        best.runs = list.filter(([_, val]) => val == max).map(([id, length]) => ({id, length, event: evSlug}));
    } else if (max == best.maxLength){

        best.runs = best.runs.concat(list.filter(([_, val]) =>  val >= max - 3).map(([id, length]) => ({id, length, event: evSlug})));
    }
}

for (let run of best.runs){
    run.name = names[run.id] ?? "[UNKNOWN]"; 
}

if (silent) unmuteStdout();

if (logdata){
    for (let run of best.runs){
        console.log("-", run.name, " with ", run.length, "sets at event", run.event);
    }
}

outputFromArgs(allArgs, best.runs, (runs) => {
    let res = "";
    for (let run of runs){
        res += columnsln(run.name, run.id, run.length, run.event);
    }
    return res;
})