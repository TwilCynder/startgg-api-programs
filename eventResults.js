import { getEventsResults } from "./include/getEventResults.js";
import {client} from "./include/lib/client.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js"
import { extractSlugs } from "startgg-helper-node"
import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { EventListParser } from "./include/lib/computeEventList.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { dateText, output, readMultimodalArrayInput, splitWhitespace } from "./include/lib/util.js";
import { readLinesAsync } from "./include/lib/readUtil.js";

let {replacementsFile, eventsSlugs, sorted, inputfile, outputFormat, outputfile, logdata, printdata, silent, eventName} = new ArgumentsManager()
    .apply(addInputParams)
    .apply(addOutputParams)
    .addOption(["-r", "--replacementsFile"])
    .addSwitch("--eventName", {
        description: "Include each event's name in the result (aside from the tournament's name)"
    })
    .addSwitch(["-s", "--sorted"], {description: "Sort by start time"})
    .addCustomParser(new EventListParser, "eventsSlugs")
    .enableHelpParameter()

    .parseProcessArguments()

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let limiter = new StartGGDelayQueryLimiter();
let events = await readMultimodalArrayInput(inputfile, getEventsResults(client, extractSlugs(eventsSlugs), undefined, limiter))  ;
limiter.stop()

console.log(events.length);

function getEventStartTime(event){
    return event.startAt ?? event.tournament.startAt;
}

events = events.filter(ev => !!ev)
if (sorted) events = events.sort((a, b) => getEventStartTime(a) - getEventStartTime(b));

let namesReplacements = {}
if (replacementsFile){
    try {
        await readLinesAsync(replacementsFile).forEach(line => {
            let [name, replacement] = splitWhitespace(line);
            if (replacement){
                namesReplacements[name] = replacement;
            }
        })
    } catch (err) {
        console.error("Couldn't load name replacements :", err);
    }
}

function substituteName(name){
    for (const n in namesReplacements){
        if (name.includes(n)){
            return namesReplacements[n];
        }
    }
    return name;
}

function generateLine(event){
    const timestamp = event.startAt ?? event.tournament.startAt;
    let date = new Date(timestamp * 1000)
    let dateString = dateText(date);
    let result = `${dateString}\t${event.tournament.name}\t${eventName ? event.name + "\t" : ""}${event.standings.nodes.length}`;

    for (const s of event.standings.nodes){
        let name = s.entrant.name;
        name = name.substring(name.lastIndexOf('|')+1).trim();
        name = substituteName(name);
        result += '\t' + name;
    }

    return result;
}

if (silent_) unmuteStdout();

printdata = printdata || logdata_;

output(outputFormat, outputfile, printdata, events, (events) => {
    let resultString = "";
    for (let event of events){
        if (!event){
            console.warn("Null event")
            continue;
        }
        //console.log(event.tournament.name, `(${event.slug}) on`, new Date(event.startAt * 1000).toLocaleDateString("fr-FR"));
        resultString += generateLine(event) + '\n';
    }
    return resultString;
});