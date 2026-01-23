import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventFilterParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { output, readEventFilterWords, readUsersFile } from "./include/lib/util.js";
import { fetchUserEvents } from "./include/fetchUserEvents.js";
import { filterEvents } from "./include/filterEvents.js";

let {
    userSlugs, filename, 
    games, minEntrants, exclude_expression, filter, filterFiles , startDate, endDate, offline, online,
    outputFormat, outputfile, logdata, printdata, silent, slugOnly
} = new ArgumentsManager()
    .apply(addOutputParams)
    .addMultiParameter("userSlugs", {
        description: "A list of users slugs to fetch events for"
    })
    .addOption(["-f", "--filename"], {
        description: "Path to a file containing a list of user slugs"
    })
    .apply(addEventFilterParams)
    .addSwitch(["-u", "--slug-only"], {dest: "slugOnly", description: "Only output the slug for each event"})
    .enableHelpParameter()

    .parseProcessArguments()

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);
if (silent_) muteStdout();

userSlugs = await readUsersFile(filename, userSlugs);
console.log(userSlugs);
let limiter = new StartGGDelayQueryLimiter;
let [data, filters] = await Promise.all([
    fetchUserEvents(client, userSlugs, limiter, {startDate, endDate, games, minEntrants}),
    readEventFilterWords(filter, filterFiles)
])
limiter.stop();

data = filterEvents(data, exclude_expression, filters, offline, online);

if (silent_) unmuteStdout();

if (logdata_){
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

output(outputFormat, outputfile, printdata, data, (data) => {
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