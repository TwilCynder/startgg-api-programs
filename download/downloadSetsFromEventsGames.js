import { Query } from "../include/lib/query.js";
import { readSchema } from "../include/lib/util.js";

import { EventListParser } from "../include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { getSetsInEvents } from "../include/getSetsInEvents.js"

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "../include/lib/queryLimiter.js";

import { muteStdout, unmuteStdout } from "../include/lib/jsUtil.js";
import { addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON } from "../include/lib/util.js";

let {events, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .addCustomParser(new EventListParser, "events")
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

console.log(events);

let query = new Query(readSchema(import.meta.url, "../include/GraphQLSchemas/EventSetsGames.txt"))
let limiter = new StartGGDelayQueryLimiter();
let data = await getSetsInEvents(client, query, events, limiter);
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);