

import { addEventParsers, readEventLists } from "../include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON, tryReadJSONInput } from "../include/lib/util.js";
import { getEntrantsBasicForEvents, getEntrantsBasicFromObjects } from "../include/getEntrantsBasic.js";

let {eventSlugs, eventsFilenames, inputfile, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .apply(addEventParsers)
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

let [events, eventObjects] = await Promise.all([readEventLists(eventSlugs, eventsFilenames), tryReadJSONInput(inputfile)]);

let limiter = new StartGGDelayQueryLimiter();

let data = await aggregateArrayDataPromises([getEntrantsBasicForEvents(client, events, undefined, limiter), eventObjects ? getEntrantsBasicFromObjects(client, eventObjects, undefined, limiter) : []]);

limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);