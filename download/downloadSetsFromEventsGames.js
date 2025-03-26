import { Query } from "../include/lib/query.js";
import { readSchema } from "../include/lib/util.js";

import { addEventParsers, readEventLists } from "../include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { getSetsInEvents } from "../include/getSetsInEvents.js"

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "../include/lib/queryLimiter.js";

import { muteStdout, unmuteStdout } from "../include/lib/jsUtil.js";
import { addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON } from "../include/lib/util.js";
import { getEventSetsGames, getEventsSetsGames } from "../include/getEventsSetsGames.js";

let {eventSlugs, eventsFilenames, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .apply(addEventParsers)
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

let events = await readEventLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter();
let data = await getEventsSetsGames(client, events, limiter);
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);