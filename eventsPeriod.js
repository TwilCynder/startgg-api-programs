import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventDateFilterParams, addEventFilterParamsExcept, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { processGameListString } from "./include/loadGames.js";
import { StartGGDelayQueryLimiter, toUNIXTimestamp } from "startgg-helper-node";
import { getEventsByDate } from "./include/getEventsByDate.js";
import { filterEventsFromTournament } from "./include/filterEvents.js";
import { createClientAuto } from "./include/lib/createClient.js";
import { output } from "./include/lib/util.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { bgreen } from "./include/lib/consoleUtil.js";

let {games, minEntrants, exclude_expression, filter, future, singles_only, startDate, endDate, countryCode, online, offline, detailed, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
    .setParameters({guessLowDashes: true})
    .addParameter("startDate", {description: "Starting date, can be a UNIX timestamp or a Javascript Date String", type: "number"})
    .addParameter("endDate", {description: "End date, can be a UNIX timestamp or a Javascript Date String", type: "number"})
    .addSwitch(["-d", "--detailed"], {description: "Include information such as display name, tournament display name, and entrantsNumber"})
    .apply(addEventFilterParamsExcept(addEventDateFilterParams))
    .addSwitch(["-S", "--singles-only"])
    .addOption(["-c", "--country-code"], {dest: "countryCode"})
    .addSwitch(["-F", "--future"], {description: "Incude events not finished yet (running or yet to be started)"})
    .apply(addOutputParams)
    .enableHelpParameter()

    .parseProcessArguments();

if (!startDate || !endDate){
    console.error("Must specify a start and end date");
    process.exit(1);
}

if (offline && online){
    console.error("Using both --offline and --online doesn't make sense");
    process.exit(1);
}

[logdata, silent] = doWeLog(logdata, printdata, outputfile, silent);

if (silent) muteStdout();

const client = await createClientAuto();
let limiter = new StartGGDelayQueryLimiter;

//---- Processing input
games = await processGameListString(client, games, limiter);
startDate = toUNIXTimestamp(startDate);
endDate = toUNIXTimestamp(endDate);

console.log("Games :", games);

let data = await getEventsByDate(client, limiter, startDate, endDate, {games, minEntrants, countryCode, future, online, singles_only}, detailed);

data = filterEventsFromTournament(data, exclude_expression, filter, minEntrants, offline, online);

limiter.stop();

if (silent) unmuteStdout();

if (logdata){
    if (detailed){
        for (const event of data){
            console.log(event.slug, bgreen(event.tournamentName + "-" + event.name), event.numEntrants, "entrants, ", event.isOnline ? "online" : "offline");
        }
    } else {
        for (const event of data){
            console.log(event.slug);
        }
    }
    console.log(data.length, "total.");
}

output(outputFormat, outputfile, printdata, data, data => {
    let res = "";
    if (detailed){
        for (const event of data){
            res += event.slug + "\t" + event.tournamentName + "\t" + event.name + "\t" + event.numEntrants + "\t" + event.isOnline + "\n";
        }
    } else {
        res = data.map(event => event.slug).join("\n")
    }
    return res;
});

//1735689661
//1738368061