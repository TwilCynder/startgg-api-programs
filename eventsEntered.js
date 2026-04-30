import { addEventFilterParams, addOutputParams, argumentsManager, doWeLogFromArgs } from "./include/lib/paramConfig.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { outputFromArgs, readEventFilterWords, readUsersFile } from "./include/lib/util.js";
import { filterEvents, filterEventsFromList } from "./include/filterEvents.js";
import { addEventParsersSwitchable, readEventSlugsLists } from "./include/lib/computeEventList.js";
import { logFilters } from "./include/logFilters.js";
import { getEventsFromUsers } from "./include/getEventsFromUser.js";


let {
    userSlugs, filename, 
    eventSlugs, eventsFilenames, games, minEntrants, exclude_expression, filter, filterFiles, startDate, endDate, offline, online, display_filters,
    slugOnly, allArgs
} = argumentsManager()
    .setParameters({guessLowDashes: true})
    .apply(addOutputParams)
    .addMultiParameter("userSlugs", {
        description: "A list of users slugs to fetch events for"
    })
    .addOption(["-f", "--filename"], {
        description: "Path to a file containing a list of user slugs"
    })
    .apply(addEventFilterParams)
    .apply(addEventParsersSwitchable)
    .addSwitch("--display-filters", {description: "If this option is used the program does nothing, only displays the active filters"})
    .addSwitch(["-u", "--slug-only"], {dest: "slugOnly", description: "Only output the slug for each event"})
    .setAbstract("Uses the provided events list as a blacklist")
    .enableHelpParameter()

    .parseProcessArguments()

let [logdata, silent] = doWeLogFromArgs(allArgs);
if (silent) muteStdout();

let [userSlugs_, filters, eventsBlacklist] = await Promise.all([
    readUsersFile(filename, userSlugs),
    readEventFilterWords(filter, filterFiles),
    readEventSlugsLists(eventSlugs, eventsFilenames)
])

console.log("User slugs :", userSlugs_);
console.log("Filters :");
logFilters(startDate, endDate, games, minEntrants, exclude_expression, filters, offline, online, eventsBlacklist);

if (display_filters) process.exit(0);

let limiter = new StartGGDelayQueryLimiter;
let data = await getEventsFromUsers(client, userSlugs_, limiter, {startDate, endDate, games, minEntrants});
limiter.stop();

data = filterEvents(data, exclude_expression, filters, offline, online);
data = filterEventsFromList(data, eventsBlacklist, true);

if (silent) unmuteStdout();

if (logdata){
    if (slugOnly){
        for (let event of data){
            console.log(event.slug);
        }
    } else {
        for (let event of data){
            console.log(event.tournament.name, '-', event.name, `(${event.slug}) |`, event.numEntrants, "entrants |", "on", new Date(event.startAt * 1000).toLocaleDateString("fr-FR"));
        }
    }

}

outputFromArgs(allArgs, data, (data) => {
    let resultString = "";
    if (slugOnly ){
        for (let event of data){
            resultString += event.slug + '\n';
        }
    } else {
        for (let event of data){
            resultString += event.slug + '\t' + event.tournament.name + '\t' + event.name + '\t' + event.numEntrants + '\t' + event.startAt + '\n';
        }
    }

    return resultString;
});