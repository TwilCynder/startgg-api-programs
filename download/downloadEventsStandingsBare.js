

import { addEventParsers, readEventLists } from "../include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addInputParams, addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { aggregateArrayDataPromises, outputJSON, tryReadJSONInput } from "../include/lib/util.js";
import { getEventsResultsBare, getEventsResultsBareFromObjects } from "../include/getEventResultsBare.js";

let {eventSlugs, eventsFilenames, inputfile, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .apply(addEventParsers) 
    .apply(addInputParams)
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

let events = await readEventLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter();

let eventObjects = await tryReadJSONInput(inputfile);

let data = await aggregateArrayDataPromises([getEventsResultsBare(client, events, undefined, limiter), eventObjects ? getEventsResultsBareFromObjects(client, eventObjects, undefined, limiter) : []]);

limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);