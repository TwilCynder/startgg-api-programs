import { getEventsSetsBasic } from "../include/getEventsSets.js";

import { EventListParser } from "../include/lib/computeEventList.js";
import { SingleOptionParser, parseArguments } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/common.js";
import { StartGGDelayQueryLimiter } from "../include/lib/queryLimiter.js";

import fs from 'fs';

let [output, slugs] = parseArguments(process.argv.slice(2), 
    new SingleOptionParser("-o"),
    new EventListParser()
)

let limiter = new StartGGDelayQueryLimiter();
let data = await getEventsSetsBasic(client, slugs, limiter);

limiter.stop();

let filename = "./out/" + output;
let file = fs.createWriteStream(filename, {encoding: "utf-8"});
file.write(JSON.stringify(data));