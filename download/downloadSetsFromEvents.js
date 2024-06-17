import { getEventsSetsBasic } from "../include/getEventsSets.js";

import { EventListParser } from "../include/lib/computeEventList.js";
import { SingleOptionParser, parseArguments } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "../include/lib/queryLimiter.js";

import fs from 'fs';
import { muteStdout, unmuteStdout } from "../include/lib/lib.js";

const [output, slugs] = parseArguments(process.argv.slice(2), 
    new SingleOptionParser("-o"),
    new EventListParser()
)

const silent = !output;
if (silent){
    muteStdout();
}

let limiter = new StartGGDelayQueryLimiter();
let data = await getEventsSetsBasic(client, slugs, limiter);

limiter.stop();

let result = JSON.stringify(data);

if (silent){
    unmuteStdout();
}

if (output){
    let filename = "./out/" + output;
    let file = fs.createWriteStream(filename, {encoding: "utf-8"});
    file.write(result);
} else {
    console.log(result);
}