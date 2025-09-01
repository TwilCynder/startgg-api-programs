import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventParsers, readEventLists } from "./include/lib/computeEventList.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { unmuteStdout, muteStdout } from "./include/lib/fileUtil.js";
import { output, readMultimodalArrayInput } from "./include/lib/util.js";
import { getEntrantsBasicForEvents } from "./include/getEntrantsBasic.js";
import { processUniqueEntrantsLeague } from "./include/uniqueEntrantsUtil.js";
import { getSortedAttendanceFromEvents } from "./include/getAttendance.js";

let {eventSlugs, eventsFilenames, name, count, minimum, inputfile, stdinput, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
    .apply(addEventParsers)
    .apply(addInputParams)
    .apply(addOutputParams)
    .addOption(["-m", "--minimum"], {description: "Filter users who attended less than this many events", type: "number"})
    .addSwitch(["-c", "--count"], {description: "Output the number of unique entrants"})
    .addSwitch(["--name"], {description: "Output the name instead of the slug"})
    .enableHelpParameter()
    .parseProcessArguments();
 
eventSlugs = await readEventLists(eventSlugs, eventsFilenames);

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let limiter = new StartGGDelayQueryLimiter;
let entrants = await readMultimodalArrayInput(inputfile, stdinput, 
    getEntrantsBasicForEvents(client, eventSlugs)
);
limiter.stop();

let users = minimum ? 
    getSortedAttendanceFromEvents(entrants, true).filter(entrant => entrant.count >= minimum).map(entrant => entrant.user) :
    processUniqueEntrantsLeague(entrants);


if (silent_) unmuteStdout();

if (logdata_){
    if (count){
        console.log(users.length)
    } else {
        for (let user of users){
            console.log(user.player.gamerTag, user.id);
        }
    }
}

output(outputFormat, outputfile, printdata, count ? users.length : users, (users) => {
    let resultString = "";
    if (name){
        for (let user of users){
            resultString += user.player.gamerTag + "\n";
        }
    } else {
        for (let user of users){
            resultString += user.slug + "\n";
        }   
    }
    return resultString;
});