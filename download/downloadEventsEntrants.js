import { addEventParsers, readEventSlugsLists } from "../include/lib/computeEventList.js";

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addOutputParamsJSON, argumentsManager, doWePrintFromArgs } from "../include/lib/paramConfig.js";
import { aggregateArrayDataPromises, outputJSONFromArgs, tryReadJSONInput } from "../include/lib/util.js";
import { getEntrantsBasicForEvents, getEntrantsBasicFromObjects } from "../include/getEntrantsBasic.js";

let {eventSlugs, eventsFilenames, inputfile, allArgs} = argumentsManager()
    .apply(addEventParsers)
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

let silent = doWePrintFromArgs(allArgs)

if (silent) muteStdout();

let [events, eventObjects] = await Promise.all([readEventSlugsLists(eventSlugs, eventsFilenames), tryReadJSONInput(inputfile)]);

let limiter = new StartGGDelayQueryLimiter();

let data = await aggregateArrayDataPromises([getEntrantsBasicForEvents(client, events, undefined, limiter), eventObjects ? getEntrantsBasicFromObjects(client, eventObjects, undefined, limiter) : []]);

limiter.stop();

if (silent){
    unmuteStdout();
}

outputJSONFromArgs(allArgs, data);