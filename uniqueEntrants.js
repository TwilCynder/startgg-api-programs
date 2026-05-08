import { addEventParsers, readEventSlugsLists } from "./include/lib/computeEventList.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { addInputParams, addOutputParams, argumentsManager, doWeLogFromArgs } from "./include/lib/paramConfig.js";
import { unmuteStdout, muteStdout } from "./include/lib/fileUtil.js";
import { outputFromArgs, readMultimodalArrayInput } from "./include/lib/util.js";
import { getEntrantsBasicForEvents } from "./include/getEntrantsBasic.js";
import { processUniqueEntrantsLeague } from "./include/uniqueEntrantsUtil.js";
import { getSortedAttendanceFromEvents } from "./include/getAttendance.js";

//======== CONFIGURING PARAMETERS ========
let {eventSlugs, eventsFilenames, name, count, minimum, inputfile, allArgs} = argumentsManager()
    .apply(addInputParams)
    .apply(addOutputParams)
    .apply(addEventParsers)
    .addOption(["-m", "--minimum"], {description: "Filter users who attended less than this many events", type: "number"})
    .addSwitch(["-c", "--count"], {description: "Output the number of unique entrants"})
    .addSwitch(["--name"], {description: "Output the name instead of the slug"})
    .enableHelpParameter()
    .parseProcessArguments();

let [logdata, silent] = doWeLogFromArgs(allArgs);
if (silent) muteStdout();

//======== LOADING DATA ========
eventSlugs = await readEventSlugsLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter;
let entrants = await readMultimodalArrayInput(inputfile, getEntrantsBasicForEvents(client, eventSlugs));
limiter.stop();

//======== PROCESSING DATA ========
let users = minimum ? 
    getSortedAttendanceFromEvents(entrants, true).filter(entrant => entrant.count >= minimum).map(entrant => entrant.user) :
    processUniqueEntrantsLeague(entrants);

//======== OUTPUT ========
if (silent) unmuteStdout();

if (logdata){
    if (count){
        console.log(users.length)
    } else {
        for (let user of users){
            console.log(user.player.gamerTag, user.id);
        }
    }
}

outputFromArgs(allArgs, count ? users.length : users, (users) => {
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