import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventFilterParams, addInputParams, addOutputParams, addUsersParams, doWeLog } from "./include/lib/paramConfig.js";
import { deep_get } from "startgg-helper-node/util";
import { unmuteStdout, muteStdout } from "./include/lib/fileUtil.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { dateText, generateLineUsingLineFunctions, getLineFormatFunctions, output, readEventFilterWords, readMultimodalArrayInput } from "./include/lib/util.js";
import { addEventParsersSwitchable, readEventLists } from "./include/lib/computeEventList.js";
import { getEventsResults } from "./include/getEventResults.js";
import { User } from "./include/user.js";
import { filterEvents } from "./include/filterEvents.js";
import { getStandingsFromUsers } from "./include/getStandingsFromUser.js";
import { getMostRelevantName } from "./include/getMostRelevantName.js";

//========== CONFIGURING PARAMETERS ==============

let {
    userSlugs, filename, userDataFile, 
    eventSlugs, eventsFilenames, 
    games, minEntrants, filter, filterFiles , exclude_expression, startDate, endDate, minimumIn, offline, online,
    outputFormat, outputfile, logdata, printdata, silent, eventName, outSlug, line_format,
    inputfile, 
} = new ArgumentsManager()
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
    .enableHelpParameter()

    .parseProcessArguments()

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);
if (silent_) muteStdout();

// ========  PROCESSING INPUT PARAMETERS ========

let events = await readEventLists(eventSlugs, eventsFilenames);

// ======== PREPARING OUTPUT =========

const textFunctions = {
    date: (event) => dateText(event.startAt ?? event.tournament.startAt),
    eventName: (event) => event.name,
    tournamentName: (event) => event.tournament.name,
    name: (event) => "" + event.tournament.name + " - " + event.name,
    slug: (event) => event.slug,
    size: (event) => event.numEntrants,
    results: (event) => event.standings.nodes.map(standing => {
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

let limiter = new StartGGDelayQueryLimiter;

let [users, data, filters] = await Promise.all([
    User.createUsersMultimodal(client, limiter, userSlugs, filename, userDataFile),
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

if (!users || users.length < 1){
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

for (let event of data){
    if (!event || !event.standings){
        
        continue;
    }
    let standings = event.standings.nodes;
    event.numEntrants = standings.length;
    event.standings.nodes = [];

    for (let standing of standings){
        let user = deep_get(standing, "entrant.participants.0.user");
        if (!user){
            console.log("No user for standing", standing.entrant.participants[0].player.gamerTag, "at", event.tournament.name, standing);
            continue;
        }

        for (let u of users){
            if (user.id == u.id){
                event.standings.nodes.push(standing);
            }
        }
    }
}

if (minimumIn){
    data = data.filter(event => event.standings.nodes.length >= minimumIn);
}

data = data.sort((a, b) => a.startAt - b.startAt);

if (silent_) unmuteStdout();

//========== OUTPUT ==============

printdata = printdata || logdata_;

output(outputFormat, outputfile, printdata, data, (data) => {
    let resultString = "";
    for (let event of data){
        //console.log(event.tournament.name, `(${event.slug}) on`, new Date(event.startAt * 1000).toLocaleDateString("fr-FR"));
        resultString += generateLineUsingLineFunctions(event, lineFunctions) + '\n';
    }

    return resultString;
});