import fs from "fs";
import { client } from "./include/lib/client.js";
import { getAttendanceFromEvents } from "./include/getAttendance.js";
import { EventListParser } from "./include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { output } from "./include/lib/util.js";
import { getEntrantsBasicForEvents } from "./include/getEntrantsBasic.js";

let {events, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
    .addCustomParser(new EventListParser, "events")
    .apply(addOutputParams)
    .enableHelpParameter()
    .parseProcessArguments();

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let limiter = new StartGGDelayQueryLimiter();
let eventResults = await getEntrantsBasicForEvents(client, events, limiter).then(res => res.filter(event => !!event.entrants));
let attendance = getAttendanceFromEvents(eventResults);
limiter.stop();

let entrantsList = []

for (let entrant of Object.values(attendance)) {
    entrantsList.push({name: entrant.player.gamerTag, attendance: entrant.count});
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

if (logdata_){
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

output(outputFormat, outputfile, printdata, {attendance: entrantsList, pools}, (data) => {
    let resultString = ""

    for (let e of entrantsList){
        resultString += e.name + '\t' + e.attendance + '\n';
    }
});