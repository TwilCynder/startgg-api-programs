import { addEventParsers, readSlugLists } from "../include/lib/computeEventList.js";

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addOutputParamsJSON, argumentsManager, doWePrintFromArgs } from "../include/lib/paramConfig.js";
import { outputJSONFromArgs } from "../include/lib/util.js";
import { getEntrantsCount } from "../include/getEntrantsCount.js";
import { QueriesProgressManager } from "../include/progressSaver.js";

let {eventSlugs, eventsFilenames, inputfile, allArgs} = argumentsManager()
    .apply(addEventParsers)
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

let silent = doWePrintFromArgs(allArgs);

if (silent) muteStdout();

let [events, eventObjects] = await Promise.all([readSlugLists(eventSlugs, eventsFilenames), tryReadJSONInput(inputfile)]);
events = events.concat(eventObjects.filter(event => !!event.slug).map(event => event.slug));

let limiter = new StartGGDelayQueryLimiter();
let data = await Promise.all(events.map(event => getEntrantsCount(client, event, limiter, false)));
limiter.stop();

if (silent){
    unmuteStdout();
}

outputJSONFromArgs(allArgs, data);

//no obj