import { getEventResults } from "./lib/getEventResults.js";
import {client} from "./lib/common.js";
import { writeFileSync } from "fs";

const replaceNames = {
    "Poring" : "CbvPoring!",
    "NTZ" : "NoTechZone"
}

if (process.argv.length < 3 ){
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " EventSlug");
    process.exit()
}

let data = await getEventResults(client, process.argv[2]);

if (!data.event){
    console.error("No data");
    process.exit();
}

function substituteName(name){
    for (const n in replaceNames){
        if (name.includes(n)){
            return replaceNames[n];
        }
    }
    return name;
}

function generateLine(date, tName, standings){
    let result = `${date}\t${tName}\tTLS\t${standings.length}`;

    for (const s of standings){
        let name = s.entrant.name;
        name = name.substring(name.lastIndexOf('|')+1).trim();
        name = substituteName(name);
        result += '\t' + name;
    }

    return result;
}

let date = new Date(data.event.startAt * 1000)
let result = generateLine(
    "Y/m/d"
        .replace('Y', date.getFullYear())
        .replace('m', date.getMonth()+1)
        .replace('d', date.getDate()),
    data.event.tournament.name,
    data.event.standings.nodes
);

console.log(result);
writeFileSync('out.txt', result);