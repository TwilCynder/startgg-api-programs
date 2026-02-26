import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventParsers, readEventLists } from "./include/lib/computeEventList.js";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { deep_get, StartGGDelayQueryLimiter } from "startgg-helper-node";
import { columns, columnsln, output, readMultimodalArrayInput } from "./include/lib/util.js";
import { getEventsResults } from "./include/getEventResults.js";
import { createClientAuto } from "./include/lib/createClient.js";
import { bgreen, yellow } from "./include/lib/consoleUtil.js";

let {eventSlugs, eventsFilenames, inputfile,
    outputFormat, outputfile, logdata, printdata, silent, fragmentOutput,
    top, reverse, positive, negative, average, detailed, min_events
} = new ArgumentsManager()
    .setParameters({guessLowDashes: true})
    .setAbstract("Computes the sum of SPRs (indicator of the difference between seed-based predicted result and final result) for each players at a set of events")
    .apply(addEventParsers)
    .apply(addInputParams)
    .apply(addOutputParams)
    .addSwitch(["-+", "--positive"], {description: "Only count positive SPR"})
    .addSwitch(["--", "--negative"], {description: "Only count negative SPR"})
    .addSwitch(["-r", "--reverse"], {description: "Output the list in reverse order (lowest total SPRs first)"})
    .addOption(["-t", "--top"], {description: "Display the top x players in the logs (does not affect the data output)", default: 3, type: "number"})
    .addOption(["-m", "--min-events"], {description: "Minimum amount of events to be displayed", default: 8, type: "number"})
    .addSwitch(["-a", "--average"], {description: "Sort by average SPR instead of sum"})
    .addSwitch(["-d", "--detailed"], {description: "Displays detailed list of events for each player"})
    .enableHelpParameter()

    .parseProcessArguments();
    
let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

// ========  PREPROCESSING INPUT ========

let [events, client] = await Promise.all([readEventLists(eventSlugs, eventsFilenames), createClientAuto()]);

// ======== LOADING DATA ========

let limiter = new StartGGDelayQueryLimiter();
let data = await readMultimodalArrayInput(inputfile, getEventsResults(client, events, undefined, limiter));
limiter.stop()

//======== PROCESSING DATA ========

const placements = [
        1,       2,      3,      4,       6,
        8,      12,     16,     24,      32,
       48,      64,     96,    128,     192,
      256,     384,    512,    768,    1024,
     1536,    2048,   3072,   4096,    6144,
     8192,   12288,  16384,  24576,   32768,
    49152,   65536,  98304, 131072,  196608,
   262144,  393216, 524288, 786432, 1048576,
  1572864, 2097152
]

function getSPR(placement, seed){
    let finalTierIndex, predictedTierIndex;
    for (let i = 0; i < placements.length; i++){
        const upperLimit = placements[i];
        
        if (placement <= upperLimit && !finalTierIndex){
            finalTierIndex = i + 1;
            if (predictedTierIndex) break;
        }

        if (seed <= upperLimit && !predictedTierIndex){
            predictedTierIndex = i + 1;
            if (finalTierIndex) break;
        }
    }
    if (!finalTierIndex || !predictedTierIndex){
        console.error("Apparently this event has more than 2097152 entrants ?")
        process.exit(1);
    }

    return predictedTierIndex - finalTierIndex;
}

let players = {}

function addRunDetailed(playerID, playerName, placement, seed, eventName){
    let spr = getSPR(placement, seed);
    if ((spr < 0 && positive) || (spr > 0 && negative)) spr = 0;

    const player = players[playerID];
    const runObject = {seed, placement, spr, eventName};

    if (player){
        player.totalSPR += Math.abs(spr);
        player.runs.push(runObject);
        player.name = player.name ?? playerName;
    } else {
        players[playerID] = {name: playerName, totalSPR: spr, runs: [runObject]}
    }
}

function addRunSimple(playerID, playerName, placement, seed, eventName){
    let spr = getSPR(placement, seed);
    if ((spr < 0 && positive) || (spr > 0 && negative)) spr = 0;

    const player = players[playerID]
    if (player){
        player.totalSPR += Math.abs(spr);;
        player.runsNb++;
        player.name = player.name ?? playerName;
    } else {
        players[playerID] = {name: playerName, totalSPR: spr, runsNb: 1}
    }
}

const addRun = detailed ? addRunDetailed : addRunSimple

eventsLoop: 
for (const event of data){
    const eventName = detailed ? (event.name && event.tournament) ? (event.tournament.name + " - " + event.name ) : event.slug : undefined;

    if (!event || !event.standings) continue;
    for (const standing of event.standings.nodes){
        const entrant = standing.entrant;
        if (!entrant) continue;

        const participants = entrant.participants;
        if (!participants) continue;

        if (participants.length > 1){
            console.log("Skipping non-1v1 event :", event.slug);
            continue eventsLoop;
        }

        const player = participants[0].player
        const placement = standing.placement;
        const seed = entrant.initialSeedNum;
        
        addRun(player.id, player.gamerTag, placement, seed, eventName);
    }
}

let playersList = Object.values(players);

if (detailed){
    for (const player of playersList){
        player.runsNb = player.runs.length;
        player.avg = player.totalSPR / player.runsNb;
    }
} else {
    for (const player of playersList){
        player.avg = player.totalSPR / player.runsNb;
    }
}

const reverseMult = reverse ? -1 : 1;
if (average){
    playersList = playersList.sort((a, b) => (a.avg - b.avg) * reverseMult);
} else {
    playersList = playersList.sort((a, b) => (a.totalSPR - b.totalSPR) * reverseMult);
}

// ======== OUTPUT ========

if (silent_) unmuteStdout();

if (logdata_){
    const cut = playersList.filter(player => player.runsNb >= min_events).slice(-top);
    for (const player of cut){
        console.log(bgreen(player.name), "| Total SPR :", player.totalSPR, "| Average :", player.avg, "| Total runs :", player.runsNb);
        if (detailed){
            for (const run of player.runs){
                console.log(`SPR ${yellow(run.spr)} (placed ${yellow(run.placement)}, seeded ${yellow(run.seed)})`, run.eventName);
            }
        }
    }
}

output(outputFormat, outputfile, printdata, playersList, list => {
    let res = "";
    for (const player of list){
        res += columnsln(
            player.name,
            player.totalSPR,
            player.runsNb,
            player.avg.toFixed(2),
        )
    }
    return res;
})