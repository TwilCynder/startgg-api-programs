import { addEventDateFilterParams, addEventFilterParamsExcept, addOutputParams, argumentsManager, doWeLog, doWeLogFromArgs } from "./include/lib/paramConfig.js";
import { processGameListString } from "./include/loadGames.js";
import { StartGGDelayQueryLimiter, toUNIXTimestamp } from "startgg-helper-node";
import { getEventsByDate } from "./include/getEventsByDate.js";
import { filterEventsFromTournament } from "./include/filterEvents.js";
import { createClientAuto } from "./include/lib/createClient.js";
import { outputFromArgs, readEventFilterWords } from "./include/lib/util.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { bgreen } from "./include/lib/consoleUtil.js";

//======== CONFIGURING PARAMETERS ========
let {games, minEntrants, exclude_expression, filter, filterFiles, future, singles_only, startDate, endDate, countryCode, online, offline, detailed, allArgs} = argumentsManager()
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

let [logdata, silent] = doWeLogFromArgs(allArgs);
if (silent) muteStdout();

//======== PREPROCESSING INPUT ========
const client = await createClientAuto();
let limiter = new StartGGDelayQueryLimiter;

games = await processGameListString(client, games, limiter);
startDate = toUNIXTimestamp(startDate);
endDate = toUNIXTimestamp(endDate);

console.log("Games :", games);

//======== LOADING DATA ========
let [data, filters] = await Promise.all([
    getEventsByDate(client, limiter, startDate, endDate, {games, minEntrants, countryCode, future, online, singles_only}, detailed),
    readEventFilterWords(filter, filterFiles)
]);
limiter.stop();

//======== PROCESSING DATA ========
data = filterEventsFromTournament(data, exclude_expression, filters, minEntrants, offline, online);

//======== OUTPUT ========
if (silent) unmuteStdout();

if (logdata){
    if (detailed){
        for (const event of data){
            console.log(event.slug, bgreen(event.tournament.name + " - " + event.name), event.numEntrants, "entrants,", event.isOnline ? "online" : `offline (${event.tournament.city})`);
        }
    } else {
        for (const event of data){
            console.log(event.slug);
        }
    }
    console.log(data.length, "total.");
}

outputFromArgs(allArgs, data, data => {
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