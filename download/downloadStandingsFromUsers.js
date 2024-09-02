import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { muteStdout, readLines, unmuteStdout } from "../include/lib/jsUtil.js";
import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "../include/lib/queryLimiter.js";
import { SwitchableEventListParser } from "../include/lib/computeEventList.js";
import { getStandingsFromUsers } from "../include/getStandingsFromUser.js";
import { getEventsResults } from "../include/getEventResults.js";
import { addOutputParamsBasic, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON } from "../include/lib/util.js";

let {userSlugs, filename, start_date, end_date, events, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .setAbstract("Computes the results achieved by a given list of users at a set of tournaments.")
    .apply(addOutputParamsBasic)
    .addSwitch(["-r", "--readable-json"], {description: "Makes the JSON output human-readable", dest: "prettyjson"})
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
    .addCustomParser(new SwitchableEventListParser, "events")
    .enableHelpParameter()

    .parseProcessArguments()


printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

if (filename){
    try {
        let fileSlugs = readLines(filename).filter(line => !!line);
        if (fileSlugs){
            userSlugs = userSlugs.concat(fileSlugs);
        }
    } catch (err){
        console.error("Could not read user slugs from file", filename, ":", err);
        process.exit(1);
    }
}


let limiter = new StartGGDelayQueryLimiter;

let data;
if (start_date || end_date){
    if (events){
        console.log("The arguments specify both a time range and an event list. The event list will be treated as a blacklist.")
    }
    data = await getStandingsFromUsers(client, userSlugs, limiter, start_date, end_date, events);
} else {
    data = await getEventsResults(client, events, undefined, limiter);
}

limiter.stop();


if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);