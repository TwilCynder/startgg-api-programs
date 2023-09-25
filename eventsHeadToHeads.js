import fs from "fs";
import { client } from "./include/lib/common.js";
import { EventListParser, computeEventList } from "./include/lib/computeEventList.js";
import { getSortedAttendanceOverLeague } from "./include/getEntrants.js";
import { OutputModeParser, parseArguments } from "@twilcynder/goombalib-js";
import {  getEventsInfo } from "./include/getEventInfo.js";
import { StartGGQueryLimiter } from "./include/lib/queryLimiter.js";
import { leagueHeadToHead } from "./include/leagueHead2Head.js";

try {

let [outputMode, slugs] = parseArguments(process.argv.slice(2), 
    new OutputModeParser("log", "eventsHeadToHead"),
    new EventListParser()
)

//console.log(await getEventsInfo(client, slugs));

//let players = await getSortedAttendanceOverLeague(client, slugs);
//console.log(players);

let limiter = new StartGGQueryLimiter();

let [infos, players] = await Promise.all([
    getEventsInfo(client, slugs),
    getSortedAttendanceOverLeague(client, slugs)
]);

for (let i in players){
    if (players[i] && players[i].count < 16) {
        players = players.slice(0, i);
    }
}

console.log(players);

let firstDate = Infinity;
let lastDate = 0;

for (let info of infos){
    if (!info) continue;

    if (info.startAt < firstDate){
        firstDate = info.startAt - 1;
    }

    if (info.startAt > lastDate) {
        lastDate = info.startAt;
    }
}

firstDate--;
lastDate += 86400;

await new Promise((resolve) => setTimeout(resolve, 60000))

let h2h = await leagueHeadToHead(client, players, firstDate, lastDate);

if (outputMode.file){
    let filename = "./out/" + outputMode.file;
    let file = fs.createWriteStream(filename, {encoding: "utf-8"});

    file.write(JSON.stringify(h2h));
}

switch (outputMode.stdout){
    case "log":
        console.log(result);
        break;
    case "string": 
        console.log(JSON.stringify(result));
}

} catch (e) {
    console.error("SHIT WENT WRONG", e)
}