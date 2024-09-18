import { getEventsResults } from "./include/getEventResults.js";
import {client} from "./include/lib/client.js";
import { muteStdout, readLines, splitWhitespace, unmuteStdout } from "./include/lib/jsUtil.js"
import { extractSlugs } from "./include/lib/tournamentUtil.js"
import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { EventListParser } from "./include/lib/computeEventList.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { output } from "./include/lib/util.js";

let {replacementsFile, eventsSlugs, outputFormat, outputfile, logdata, printdata, silent, eventName} = new ArgumentsManager()
    .apply(addOutputParams)
    .addOption(["-r", "--replacementsFile"])
    .addSwitch("--eventName", {
        description: "Include each event's name in the result (aside from the tournament's name)"
    })
    .addCustomParser(new EventListParser, "eventsSlugs")
    .enableHelpParameter()

    .parseProcessArguments()

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let limiter = new StartGGDelayQueryLimiter();
let events = await getEventsResults(client, extractSlugs(eventsSlugs), undefined);
limiter.stop()

console.log(events.length);

events = events.filter(ev => !!ev).sort((a, b) => a.startAt - b.startAt);

let namesReplacements = {}
if (replacementsFile){
    try {
        readLines(replacementsFile).forEach(line => {
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
    let date = new Date(event.startAt * 1000)
    let dateString = "d/m/Y"
        .replace('Y', date.getFullYear())
        .replace('m', date.getMonth()+1)
        .replace('d', date.getDate());
    let result = `${dateString}\t${event.tournament.name}\t${eventName ? event.name + "\t" : ""}TLS\t${event.standings.nodes.length}`;

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