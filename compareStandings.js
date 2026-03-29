import { client } from "./include/lib/client.js";
import { User } from "./include/user.js";
import * as SC from "./include/computeStandingComparison.js";   
import { addEventFilterParams, addInputParams, addOutputParamsCustom, addUsersParams, argumentsManager, doWePrintFromArgs } from "./include/lib/paramConfig.js";
import { addEventParsersSwitchable, readSlugLists } from "./include/lib/computeEventList.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { getEventsResults } from "./include/getEventResults.js";
import { outputFromArgs, readEventFilterWords, readMultimodalArrayInput } from "./include/lib/util.js";
import { filterEvents } from "./include/filterEvents.js";
import { getStandingsFromUsers } from "./include/getStandingsFromUser.js";

let {
    eventSlugs, eventsFilenames, userSlugs, filename, userDataFile, filterUsers, inputfile,
    games, minEntrants, startDate, endDate, exclude_expression, filter, filterFiles, offline, online,
    allArgs
} = argumentsManager()
    .apply(addUsersParams)
    .apply(addEventParsersSwitchable)
    .apply(addEventFilterParams)
    .apply(addOutputParamsCustom(false, true, true))
    .apply(addInputParams)
    .enableHelpParameter()
    .setMissingArgumentBehavior("Missing argument", 1, false)
    .parseProcessArguments();

let silent = doWePrintFromArgs(allArgs);
if (silent) muteStdout();

let events = await readSlugLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter;

let [users, eventsStandings, filters] = await Promise.all([
    User.createUsersMultimodal(client, limiter, userSlugs, filename, userDataFile, filterUsers),
    readMultimodalArrayInput(inputfile, 
        (startDate || endDate) ? 
        getStandingsFromUsers(client, userSlugs, events, limiter, {startDate, endDate, games, minEntrants}) :
        getEventsResults(client, events, undefined, limiter)
    ),
    readEventFilterWords(filter, filterFiles)
])

limiter.stop();

eventsStandings = filterEvents(eventsStandings, exclude_expression, filters, offline, online);

//console.log(users, eventsStandings);

let matrix = SC.computeStandingComparisonFromStandings(users, eventsStandings);

if (silent) unmuteStdout();

outputFromArgs(allArgs, matrix, (matrix) => {
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