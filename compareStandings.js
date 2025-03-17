import { client } from "./include/lib/client.js";
import { User } from "./include/user.js";
import * as SC from "./include/computeStandingComparison.js";   
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 
import { addEventFilterParams, addInputParams, addOutputParamsCustom, addUsersParams, doWeLog, isSilent } from "./include/lib/paramConfig.js";
import { addEventParsersSwitchable, readEventLists, SwitchableEventListParser } from "./include/lib/computeEventList.js";
import { muteStdout, readJSONInput, readLines, unmuteStdout } from "./include/lib/jsUtil.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { getEventsResults } from "./include/getEventResults.js";
import { readJSONFromStdin } from "./include/lib/loadInput.js";
import { output } from "./include/lib/util.js";
import { loadGames } from "./include/loadGames.js";
import { filterEvents } from "./include/filterEvents.js";
import { fetchUsersStandings, tryReadUsersFile } from "./include/fetchUserEvents.js";

let {
    eventSlugs, eventsFilenames, userSlugs, filename, userDataFile, 
    games, minEntrants, startDate, endDate, exclude_expression, filter, offline, 
    outputFormat, outputfile, printdata, silent, inputfile, stdinput
} = new ArgumentsManager()
    .apply(addUsersParams)
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

let [events, usersSlugs] = await Promise.all([
    readEventLists(eventSlugs, eventsFilenames),
    tryReadUsersFile(filename, userSlugs)
])

let limiter = new StartGGDelayQueryLimiter;

let [users, eventsStandings] = await Promise.all([
    User.createUsersMultimodal(client, usersSlugs, limiter, userDataFile),
    Promise.all([
        inputfile ? readJSONInput(inputfile).catch(err => {
            console.warn(`Could not open file ${inputfile} : ${err}`)
            return [];
        }) : null,
        stdinput ? readJSONFromStdin() : null,

        (async ()=>{
            if (startDate || endDate){
                return await fetchUsersStandings(client, userSlugs, events, limiter, {startDate, endDate, games, minEntrants});
            } else {
                return await getEventsResults(client, events, undefined, limiter);
            }
        })()
    ]).then(results => results.reduce((previous, current) => current ? previous.concat(current) : previous, []))
])

limiter.stop();

eventsStandings = filterEvents(eventsStandings, exclude_expression, filter, offline);

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