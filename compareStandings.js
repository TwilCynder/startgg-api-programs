import { client } from "./include/lib/client.js";
import { User } from "./include/user.js";
import * as SC from "./include/computeStandingComparison.js";   
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 
import { addEventFilterParams, addInputParams, addOutputParamsCustom, doWeLog, isSilent } from "./include/lib/paramConfig.js";
import { addEventParsersSwitchable, readEventLists, SwitchableEventListParser } from "./include/lib/computeEventList.js";
import { muteStdout, readJSONAsync, readLines, unmuteStdout } from "./include/lib/jsUtil.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { getStandingsFromUsers } from "./include/getStandingsFromUser.js";
import { getEventsResults } from "./include/getEventResults.js";
import { loadInputFromStdin } from "./include/lib/loadInputStdin.js";
import { output } from "./include/lib/util.js";
import { loadGames } from "./include/loadGames.js";
import { filterEvents } from "./include/filterEvents.js";

let {eventSlugs, eventsFilenames, slugsFilename, games, minEntrants, startDate, endDate, exclude_expression, filter, outputFormat, outputfile, printdata, silent, inputfile, stdinput} = new ArgumentsManager()
    .addParameter("slugsFilename", {}, false)
    .addParameter("startDate", {type: "number"}, true)
    .addParameter("endDate", {type: "number"}, true)
    .apply(addEventParsersSwitchable)
    .apply(addEventFilterParams)
    .apply(addOutputParamsCustom(false, true))
    .apply(addInputParams)
    .enableHelpParameter()
    .setMissingArgumentBehavior("Missing argument", 1, false)
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent);

if (silent_) muteStdout();

let events = await readEventLists(eventSlugs, eventsFilenames);

let userSlugs;
try {
    userSlugs = readLines(slugsFilename).filter(line => !!line);
} catch (err){
    console.error("Could not read user slugs from file", slugsFilename, ":", err);
    process.exit(1);
}

let limiter = new StartGGDelayQueryLimiter;

let [users, eventsStandings] = await Promise.all([
    User.createUsers(client, userSlugs, limiter),
    Promise.all([
        inputfile ? readJSONAsync(inputfile).catch(err => {
            console.warn(`Could not open file ${inputfile} : ${err}`)
            return [];
        }) : null,
        stdinput ? loadInputFromStdin() : null,

        (async ()=>{
            if (startDate || endDate){
                if (events.length > 0){
                    console.warn("Both a start date/end date and a list of events have been specified. This program can only use one of these methods of fetching events ; the events list will be ignored.");
                }

                console.log("Looking for events after", new Date(startDate * 1000).toLocaleDateString("fr-FR"), "and before", new Date(endDate * 1000).toLocaleDateString("fr-FR"));

                return await getStandingsFromUsers(client, userSlugs, limiter, {startDate, endDate, minEntrants, games: loadGames(client, games, limiter)});
            } else {
                return await getEventsResults(client, events, undefined, limiter);
            }
        })()
    ]).then(results => results.reduce((previous, current) => current ? previous.concat(current) : previous, []))
])

limiter.stop();

eventsStandings = filterEvents(eventsStandings, exclude_expression, filter);

//console.log(users, eventsStandings);

let matrix = SC.computeStandingComparisonFromStandings(users, eventsStandings);

if (silent_) unmuteStdout();

output(outputFormat, outputfile, printdata, matrix, (matrix) => {
    let result = "\\\\\\";
    for (let user of users){
        result += '\t' + user.name;
    }

    for (let i = 0; i < users.length ; i++){
        result+= '\n' + users[i].name
        for (let j = 0; j < users.length; j++){
            if (i == j){
                result += '\tXXXX'
            } else if (i < j){
                let comp = SC.getSCFromIndex(matrix, users, i, j);
                result += '\t' + comp.left + "-" + comp.draws + "-" + comp.right;
            } else if (i > j){  
                let comp = SC.getSCFromIndex(matrix, users, j, i);
                result += '\t' + comp.right + "-" + comp.draws + "-" + comp.left;
            }
        }
    }

    return result;
})