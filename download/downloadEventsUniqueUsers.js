

import { addEventParsers, EventListParser, readEventLists } from "../include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addInputParams, addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON } from "../include/lib/util.js";
import { getUniqueUsersBasicOverLeague } from "../include/getEntrantsBasic.js";

let {eventSlugs, eventsFilenames, inputfile, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .apply(addEventParsers)
    .apply(addInputParams)
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

let [events, eventObjects] = await Promise.all([readEventLists(eventSlugs, eventsFilenames), tryReadJSONInput(inputfile)]);
events = events.concat(eventObjects.filter (event => !!event.slug).map(event => event.slug));

let limiter = new StartGGDelayQueryLimiter();
let data = await getUniqueUsersBasicOverLeague(client, events, limiter);
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);