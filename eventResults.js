import { getEventsResults } from "./include/getEventResults.js";
import {client} from "./include/lib/client.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js"
import { extractSlugs } from "startgg-helper-node"
import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventParsers, EventListParser } from "./include/lib/computeEventList.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { dateText, generateLineUsingLineFunctions, output, readMultimodalArrayInput, splitWhitespace } from "./include/lib/util.js";
import { readLinesAsync } from "./include/lib/readUtil.js";
import { getMostRelevantName } from "./include/getMostRelevantName.js";

let {replacementsFile, eventsSlugs, sorted, line_format, inputfile, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
    .setParameters({guessLowDashes: true})
    .apply(addInputParams)
    .apply(addOutputParams)
    .addOption(["-r", "--replacementsFile"])
    /*.addSwitch("--eventName", {
        description: "Include each event's name in the result (aside from the tournament's name)"
    })*/
    .addSwitch(["-S", "--sorted"], {description: "Sort by start time"})
    //.addSwitch(["-u", "--output-slug"], {dest: "outSlug", description: "Include event slugs in the csv output"})
    .addOption(["-L", "--line-format"], {description: 'String describing the format of each line. It should contain words separated by spaces ; words should be "date", "eventName", "tournamentName", "name", "slug", "size", "blank" and "results". "results" is added automatically at the end if not present.'})
    .apply(addEventParsers)
    .enableHelpParameter()

    .parseProcessArguments()

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

// ===== PREPARING OUTPUT =========

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

const textFunctions = {
    date: (event) => dateText(event.startAt ?? event.tournament.startAt),
    eventName: (event) => event.name,
    tournamentName: (event) => event.tournament.name,
    name: (event) => "" + event.tournament.name + " - " + event.name,
    slug: (event) => event.slug,
    size: (event) => event.standings.nodes.length,
    results: (event) => event.standings.nodes.map(standing => {
        let name = getMostRelevantName(standing.entrant);
        name = substituteName(name);
        return name;
    }).join("\t"),
    weekly: (event) => event.isWeekly ? "TRUE" : "FALSE"
}

const defaultLineFunctions = [
    textFunctions.date, 
    textFunctions.name, 
    textFunctions.size, 
    textFunctions.results
]

/** @type {(typeof textFunctions.date)[]} */
let lineFunctions;
if (line_format){
    let resultsUsed = false;
    for (const word of line_format.split(/\s+/g)){
        if (!word) continue;
        const f = textFunctions[word];
        if (!f) {
            console.error("Bad property name in line format :", word, ". Possible names are " + Object.keys(textFunctions).join(", "));
            process.exit(1);
        }
        if (f == textFunctions.results) resultsUsed = true;
        if (f) lineFunctions.push(f);
    }
    if (!resultsUsed) lineFunctions.push(textFunctions.results);
} else {
    lineFunctions = defaultLineFunctions;
}

//========== LOADING DATA ==============

let limiter = new StartGGDelayQueryLimiter();
let events = await readMultimodalArrayInput(inputfile, getEventsResults(client, extractSlugs(eventsSlugs), undefined, limiter))  ;
limiter.stop()

console.log(events.length);

function getEventStartTime(event){
    return event.startAt ?? event.tournament.startAt;
}

//========== PROCESSING DATA ==============

events = events.filter(ev => !!ev)
if (sorted) events = events.sort((a, b) => getEventStartTime(a) - getEventStartTime(b));

if (silent_) unmuteStdout();

//========== OUTPUT ==============

printdata = printdata || logdata_;
output(outputFormat, outputfile, printdata, events, (events) => {
    let resultString = "";
    for (let event of events){
        if (!event){
            console.warn("Null event")
            continue;
        }
        //console.log(event.tournament.name, `(${event.slug}) on`, new Date(event.startAt * 1000).toLocaleDateString("fr-FR"));
        resultString += generateLineUsingLineFunctions(event, lineFunctions) + '\n';
    }
    return resultString;
});