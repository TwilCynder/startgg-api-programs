import { getEventResults, getEventsResults } from "./include/getEventResults.js";
import {client} from "./include/lib/common.js";
import { splitNewline, splitWhitespace } from "./include/lib/lib.js"
import { extractSlugs } from "./include/lib/tournamentUtil.js"
import { OutputModeParser, SingleOptionParser, parseArguments } from "@twilcynder/arguments-parser";
import { EventListParser } from "./include/lib/computeEventList.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { mkdir, mkdirSync, readFileSync, writeFileSync } from "fs";

if (process.argv.length < 3 ){
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " EventSlug");
    process.exit()
}

let [replacementsFile, outputMode, list] = parseArguments(process.argv.slice(2), 
    new SingleOptionParser("-r"),
    new OutputModeParser("stdout"), 
    new EventListParser(),
);

let limiter = new StartGGDelayQueryLimiter();
let events = await getEventsResults(client, extractSlugs(list), undefined, limiter);
limiter.stop()

let namesReplacements = {}
if (replacementsFile){
    try {
        namesReplacements = splitNewline(readFileSync(replacementsFile, {encoding: "utf-8"}).toString()).forEach(line => {
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
    let result = `${dateString}\t${event.tournament.name}\tTLS\t${event.standings.nodes.length}`;

    for (const s of event.standings.nodes){
        let name = s.entrant.name;
        name = name.substring(name.lastIndexOf('|')+1).trim();
        name = substituteName(name);
        result += '\t' + name;
    }

    return result;
}

let result = "";

for (let event of events){
    if (event){
        result += generateLine(event) + "\n";
    }
}

console.log(result);
writeFileSync('out/eventResults.txt', result);