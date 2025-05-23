import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { muteStdout, unmuteStdout } from "startgg-helper-node";
import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper-node";
import { addEventParsers, readEventLists } from "../include/lib/computeEventList.js";
import { addEventQueryFilterParams, addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON } from "../include/lib/util.js";
import { fetchUsersStandings } from "../include/fetchUserStandings.js";
import { readLines } from "../include/lib/readUtil.js";

let {userSlugs, filename, startDate, endDate, eventSlugs, eventsFilenames, games, minEntrants, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .setAbstract("Computes the results achieved by a given list of users at a set of tournaments.")
    .apply(addOutputParamsJSON)
    .addMultiParameter("userSlugs", {
        description: "A list of users slugs to fetch events for"
    })
    .addOption(["-f", "--filename"], {
        description: "Path to a file containing a list of user slugs"
    })
    .apply(addEventQueryFilterParams)
    .apply(addEventParsers)
    .enableHelpParameter()

    .parseProcessArguments()


printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

let events = await readEventLists(eventSlugs, eventsFilenames);

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
let data = await fetchUsersStandings(client, userSlugs, events, limiter, {startDate, endDate, minEntrants, games});
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);