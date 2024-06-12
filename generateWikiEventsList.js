import fs from "fs";
import { client } from "./include/lib/client.js";
import { EventListParser } from "./include/lib/computeEventList.js";
import { OutputModeParser, parseArguments } from "@twilcynder/arguments-parser";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { getEventsResults} from "./include/getEventResults.js"
import { getDateString } from "./include/dateString.js";

let [outputMode, slugs] = parseArguments(process.argv.slice(2), 
    new OutputModeParser("log", "wikiList"),
    new EventListParser()
)

let limiter = new StartGGDelayQueryLimiter();

let data = await getEventsResults(client, slugs, 2, limiter);
limiter.stop();

console.log(data)

data = data.filter((ev) => !!ev);
data = data.sort((a, b) => a.startAt - b.startAt);

console.log(data)

let result = ""
for (let ev of data){
    if (!ev) continue;

    result += "|-\n";
    result += "|[https://start.gg/" + ev.slug + " " + ev.tournament.name;
    result += "]||";
    let date = new Date(ev.startAt * 1000);
    result += getDateString(date);
    result += "||";
    result += ev.numEntrants;
    let pName = ev.standings.nodes[0].entrant.name;
    pName = pName.substring(pName.lastIndexOf('|')+1).trim();
    result += `||{{Sm|${pName}}}`;
    pName = ev.standings.nodes[1].entrant.name;
    pName = pName.substring(pName.lastIndexOf('|')+1).trim();
    result += `||{{Sm|${pName}}}`;
    result += "\n";
}

outputString(result, outputMode);

/*
|-
|[http://challonge.com/MSM0 Mega Smash Monday 0]||May 11th, 2015||38||{{Sm|K9sbruce}}||{{Sm|Zenyou}}
*/