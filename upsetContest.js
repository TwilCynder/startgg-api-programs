import { getEventSetsBasic, getEventsSetsBasic } from "./include/getEventsSets.js";

import { EventListParser } from "./include/lib/computeEventList.js";
import { OutputModeParser, parseArguments } from "@twilcynder/goombalib-js"; 

import { client } from "./include/lib/common.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";

let [outputMode, slugs] = parseArguments(process.argv.slice(2), 
    new OutputModeParser("log", "casseur2bracket"),
    new EventListParser()
)

let limiter = new StartGGDelayQueryLimiter();
let data = await getEventsSetsBasic(client, slugs, limiter);

limiter.stop();

console.log(data);