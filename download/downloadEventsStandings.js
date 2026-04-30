import { addEventParsers, readEventSlugsLists } from "../include/lib/computeEventList.js";

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addInputParams, addOutputParamsJSON, argumentsManager, doWePrintFromArgs } from "../include/lib/paramConfig.js";
import { aggregateArrayDataPromises, outputJSONFromArgs, tryReadJSONInput } from "../include/lib/util.js";

let {eventSlugs, eventsFilenames, inputfile, bare, allArgs} = argumentsManager()
    .apply(addEventParsers) 
    .apply(addInputParams)
    .apply(addOutputParamsJSON)
    .addSwitch(["-b", "--bare"], {description: "Fetches standings with bare minimum info, using the EventStandingsBare query instead of EventStanding"})
    .enableHelpParameter()
    .parseProcessArguments();

let silent = doWePrintFromArgs(allArgs);

if (silent) muteStdout();

let [events, eventObjects, getters] = await Promise.all([readEventSlugsLists(eventSlugs, eventsFilenames), tryReadJSONInput(inputfile), (bare ? 
    import("../include/getEventResultsBare.js").then((m) => ({default: m.getEventsResultsBare, object: m.getEventsResultsBareFromObjects})) : 
    import("../include/getEventResults.js").then((m) => ({default: m.getEventsResults, object: m.getEventsResultsFromObjects}))
)]);

let limiter = new StartGGDelayQueryLimiter();
let data = await aggregateArrayDataPromises([getters.default(client, events, undefined, limiter), eventObjects ? getters.object(client, eventObjects, undefined, limiter) : []]);

limiter.stop();

if (silent){
    unmuteStdout();
}

outputJSONFromArgs(allArgs, data);