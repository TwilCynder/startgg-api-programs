import { addEventFilterParams, addInputParams, addOutputParams, addUsersParams, argumentsManager, doWeLogFromArgs } from "./include/lib/paramConfig.js";
import { deep_get } from "startgg-helper-node/util";
import { unmuteStdout, muteStdout } from "./include/lib/fileUtil.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { dateText, generateLineUsingLineFunctions, getLineFormatFunctions, outputFromArgs, readEventFilterWords, readMultimodalArrayInput } from "./include/lib/util.js";
import { addEventParsersSwitchable, readEventSlugsLists } from "./include/lib/computeEventList.js";
import { getEventsResults } from "./include/getEventResults.js";
import { User } from "./include/user.js";
import { filterEvents } from "./include/filterEvents.js";
import { getStandingsFromUsers } from "./include/getStandingsFromUser.js";
import { getMostRelevantName } from "./include/getMostRelevantName.js";
import { bgreen, bred, yellow } from "./include/lib/consoleUtil.js";

//========== CONFIGURING PARAMETERS ==============
let {
    userSlugs, filename, userDataFile, filterUsers,
    eventSlugs, eventsFilenames, 
    games, minEntrants, filter, filterFiles , exclude_expression, startDate, endDate, minimumIn, offline, online,
    eventName, outSlug, line_format, table_mode,
    inputfile, allArgs
} = argumentsManager()
    .setParameters({guessLowDashes: true})    
    .setAbstract("Computes the results achieved by a given list of users at a set of tournaments. You can use preexisting standings data as fetched by download/downloadStandingsFromUsers.js or by download/downloadEventsStandings.js, or ")
    .apply(addOutputParams)
    .apply(addInputParams)
    .apply(addEventParsersSwitchable)
    .apply(addUsersParams)
    .addOption(["-M", "--minimum-in"], {
        dest: "minimumIn",
        type: "number",
        description: "Minimum amount of users for an event to be included in the output"
    })
    .apply(addEventFilterParams)
    .addOption(["-L", "--line-format"], {description: 'String describing the format of each line. It should contain words separated by spaces ; words should be "date", "eventName", "tournamentName", "name", "slug", "size", "blank" and "results". "results" is added automatically at the end if not present.'})
    .addSwitch(["-u", "--output-slug"], {dest: "outSlug", description: "Include event slugs in the csv output"})
    .addSwitch("--eventName", {
        description: "Include each event's name in the csv result (aside from the tournament's name)"
    })
    .addSwitch(["-T", "--table-mode"], {description: "Outside of a list of each present player in placement roder for each event in the output, presents the result for all players, always in the same order"})

    .enableHelpParameter()

    .parseProcessArguments()

let [logdata, silent] = doWeLogFromArgs(allArgs);
if (silent) muteStdout();

// ======== PREPARING OUTPUT =========

const textFunctions = {
    date: (event) => dateText(event.startAt ?? event.tournament.startAt),
    eventName: (event) => event.name,
    tournamentName: (event) => event.tournament.name,
    name: (event) => "" + event.tournament.name + " - " + event.name,
    slug: (event) => event.slug,
    size: (event) => event.numEntrants,
    results: table_mode ? 
        (event) => event.results.map(standing => {
                return standing ? standing.placement : "";
            }).join("\t") : 
        (event) => event.standings.nodes.map(standing => {
                let name = getMostRelevantName(standing.entrant);
                return standing.placement + " : " + name;
            }).join("\t"),
    weekly: (event) => event.isWeekly ? "TRUE" : "FALSE"
}

const defaultLineFunctions = [
    textFunctions.date, 
    textFunctions.tournamentName,
    eventName ? textFunctions.eventName : null, 
    textFunctions.size, 
    outSlug ? textFunctions.slug : null,
    textFunctions.results
]

const lineFunctions = getLineFormatFunctions(line_format, textFunctions, defaultLineFunctions, ["results"]);

//========== LOADING DATA ==============
let events = await readEventSlugsLists(eventSlugs, eventsFilenames);
let limiter = new StartGGDelayQueryLimiter;

let [[usersArray, usersMap], data, filters] = await Promise.all([
    User.createUsersMultimodal(client, limiter, userSlugs, filename, userDataFile, filterUsers, "both"),
    readMultimodalArrayInput(inputfile, 
        (async()=>{
            if (startDate || endDate){
                return await getStandingsFromUsers(client, userSlugs, limiter, {startDate, endDate, minEntrants, games}, eventSlugs);
            } else {
                return await getEventsResults(client, events, undefined, limiter);
            }
        })()
    ),
    readEventFilterWords(filter, filterFiles)
])

limiter.stop();

//========== PROCESSING DATA ==============

if (!usersArray || usersArray.length < 1){
    console.warn("No users specified : result will be empty");
}

data = data.filter(event => {
    if (!event || !event.standings){
        console.warn("No standings for event", event ? event.slug : null);
        return false;
    }
    return true;
});
data = filterEvents(data, exclude_expression, filters, offline, online);

const getStandingUser = standing => deep_get(standing, "entrant.participants.0.user");

if (table_mode){
    let i = 0;
    for (let user of usersArray){
        user.i = i;
        i++
    }
    for (let event of data){
        if (!event || !event.standings){
            continue;
        }
        event.results = new Array(usersArray.length).fill(null);
        event.nonEmptyResults = 0;

        let standings = event.standings.nodes;
        event.numEntrants = standings.length;
        for (let standing of standings){
            const standingUser = getStandingUser(standing);
            if (!standingUser){
                console.log("No user for standing", deep_get(standing, "entrant.participants.0.player.gamerTag"), "at", event.tournament.name, standing);
                continue;
            }

            const user = usersMap.get(standingUser.discriminator);
            if (user){
                event.nonEmptyResults++;
                event.results[user.i] = standing;
            }
        }
        event.standings = undefined;
    }
    if (minimumIn){
        data = data.filter(event => event.nonEmptyResults >= minimumIn);
    }
} else {
    for (let event of data){
        if (!event || !event.standings){
            continue;
        }
        let standings = event.standings.nodes;
        event.numEntrants = standings.length;
        event.standings.nodes = [];

        for (let standing of standings){
            const standingUser = getStandingUser(standing);
            if (!standingUser){
                console.log("No user for standing", deep_get(standing, "entrant.participants.0.player.gamerTag"), "at", event.tournament.name, standing);
                continue;
            }

            if (usersMap.has(standingUser.discriminator)){
                event.standings.nodes.push(standing);
            }
        }
    }
    if (minimumIn){
        data = data.filter(event => event.standings.nodes.length >= minimumIn);
    }
}


data = data.sort((a, b) => a.tournament.startAt - b.tournament.startAt);

//========== OUTPUT ==============
if (silent) unmuteStdout();
if (logdata){
    if (table_mode){
        console.log("Results for", usersArray.map(user => user.name).join(", "));
        for (const event of data){
            let lowest = event.results.reduce((prev, standing) => standing.placement < prev ? standing.placement : prev, Infinity);
            console.log(event.results.map(standing => standing.placement <= lowest ? bgreen(standing.placement) : bred(standing.placement)).join(" | "), "at", yellow(event.tournament.name), "-", yellow(event.name));
        }
    } else {
        for (const event of data){
            console.log(yellow(event.tournament.name), "-", yellow(event.name), "::", event.standings.nodes.map(standing => getMostRelevantName(standing.entrant) + ": " + yellow(standing.placement)).join(", "));
        }
    }
}

outputFromArgs(allArgs, data, (data) => {
    let resultString = "";
    for (let event of data){
        resultString += generateLineUsingLineFunctions(event, lineFunctions) + '\n';
        //console.log(event.tournament.name, `(${event.slug}) on`, new Date(event.startAt * 1000).toLocaleDateString("fr-FR"));
        
    }

    return resultString;
});