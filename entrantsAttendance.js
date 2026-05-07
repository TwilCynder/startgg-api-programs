import { client } from "./include/lib/client.js";
import { getAttendanceFromEvents } from "./include/getAttendance.js";
import { addEventParsers, readEventSlugsLists } from "./include/lib/computeEventList.js";
import { addInputParams, addOutputParams, argumentsManager, doWeLogFromArgs } from "./include/lib/paramConfig.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { outputFromArgs, readMultimodalArrayInput } from "./include/lib/util.js";
import { getEntrantsBasicForEvents } from "./include/getEntrantsBasic.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";

//======== CONFIGURING PARAMETERS ========
let {eventSlugs, eventsFilenames, inputfile, allArgs} = argumentsManager()
    .apply(addEventParsers)
    .apply(addInputParams)
    .apply(addOutputParams)
    .enableHelpParameter()
    .parseProcessArguments();

let [logdata, silent] = doWeLogFromArgs(allArgs);

if (silent) muteStdout();

//======== LOADING DATA ========
let events = await readEventSlugsLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter();
let eventResults = await readMultimodalArrayInput(inputfile, getEntrantsBasicForEvents(client, events, limiter).then(res => res.filter(event => !!event.entrants)));

let attendance = getAttendanceFromEvents(eventResults);
limiter.stop();

//======== PROCESSING DATA ========
let entrantsList = [];

for (let entrant of Object.values(attendance)) {
    entrantsList.push({name: entrant.user.player.gamerTag, attendance: entrant.count});
}
entrantsList.sort((a, b) => a.attendance - b.attendance);

let pools = {};
let t = 1;
let count = 0;
for (let e of entrantsList){
    if (e.attendance > t){
        if (count > 0) pools[t] = count;
        count = 0;
        t = e.attendance;
    }
    count++;
}
pools[t] = count;

//======== OUTPUT ========
if (silent) unmuteStdout();

if (logdata){
    for (let e of entrantsList){
        console.log(e.name, e.attendance);
    }
    console.log("-----------------");
    let cumulative = 0;
    for (let i = events.length; i > 0; i--){
        if (!pools[i]) continue;
        cumulative += pools[i];
        console.log(i, "tournaments :", pools[i], '\t', "total :", cumulative);
    }
}

outputFromArgs(allArgs, {attendance: entrantsList, pools}, (data) => {
    let resultString = ""

    for (let e of entrantsList){
        resultString += e.name + '\t' + e.attendance + '\n';
    }

    return resultString;
});