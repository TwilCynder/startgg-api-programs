import { addEventParsers, readSlugLists } from "../include/lib/computeEventList.js";

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addInputParams, addOutputParamsJSON, argumentsManager, doWePrintFromArgs } from "../include/lib/paramConfig.js";
import {  outputJSONFromArgs } from "../include/lib/util.js";
import { getUniqueUsersBasicOverLeague } from "../include/getEntrantsBasic.js";

let {eventSlugs, eventsFilenames, inputfile, allArgs} = argumentsManager()
    .apply(addEventParsers)
    .apply(addInputParams)
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

let silent = doWePrintFromArgs(allArgs);

if (silent_) muteStdout();

let [events, eventObjects] = await Promise.all([readSlugLists(eventSlugs, eventsFilenames), tryReadJSONInput(inputfile)]);
events = events.concat(eventObjects.filter (event => !!event.slug).map(event => event.slug));

let limiter = new StartGGDelayQueryLimiter();
let data = await getUniqueUsersBasicOverLeague(client, events, limiter);
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSONFromArgs(allArgs, data);