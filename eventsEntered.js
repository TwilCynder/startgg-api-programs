import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { muteStdout, readLines, unmuteStdout } from "./include/lib/lib.js";
import { getEventsFromUsers } from "./include/getEventsFromUser.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { output } from "./include/lib/util.js";

let {userSlugs, filename, start_date, end_date, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
    .apply(addOutputParams)
    .addMultiParameter("userSlugs", {
        description: "A list of users slugs to fetch events for"
    })
    .addOption(["-f", "--filename"], {
        description: "Path to a file containing a list of user slugs"
    })
    .addOption("--start_date", {
        type: "number",
        description: "Only count tournaments after this UNIX date"
    })
    .addOption("--end_date", {
        type: "number",
        description: "Only count tournaments before this UNIX date"
    })
    .enableHelpParameter()

    .parseProcessArguments()

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

try {
    let fileSlugs = readLines(filename).filter(line => !!line);
    if (fileSlugs){
        userSlugs = userSlugs.concat(fileSlugs);
    }
} catch (err){
    console.error("Could not read user slugs from file", filename, ":", err);
    process.exit(1);
}

console.log(end_date, start_date);

let limiter = new StartGGDelayQueryLimiter;
let data = await getEventsFromUsers(client, userSlugs, limiter, start_date, end_date)
limiter.stop();

if (silent_) unmuteStdout();

if (logdata_){
    for (let event of data){
        console.log(event.tournament.name, `(${event.slug}) |`, event.numEntrants, "entrants |", "on", new Date(event.startAt * 1000).toLocaleDateString("fr-FR"));
    }
}

output(outputFormat, outputfile, printdata, data, (data) => {
    let resultString = "";
    for (let event of data){
        resultString += event.slug + '\t' + event.tournament.name + '\t' + event.numEntrants + '\t' + event.startAt + '\n';
    }
    return resultString;
});