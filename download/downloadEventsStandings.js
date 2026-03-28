import { addEventParsers, readSlugLists } from "../include/lib/computeEventList.js";

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addInputParams, addOutputParamsJSON, argumentsManager, isSilent } from "../include/lib/paramConfig.js";
import { aggregateArrayDataPromises, outputJSON, tryReadJSONInput } from "../include/lib/util.js";

let {eventSlugs, eventsFilenames, inputfile, outputFiles, printdata, silent, prettyjson, fragmentOutput, formattedOutput, bare} = argumentsManager()
    .apply(addEventParsers) 
    .apply(addInputParams)
    .apply(addOutputParamsJSON)
    .addSwitch(["-b", "--bare"], {description: "Fetches standings with bare minimum info, using the EventStandingsBare query instead of EventStanding"})
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || nullArray(outputFiles);
let silent_ = isSilent(printdata, silent);

if (silent_) muteStdout();

let [events, eventObjects, getters] = await Promise.all([readSlugLists(eventSlugs, eventsFilenames), tryReadJSONInput(inputfile), (bare ? 
    import("../include/getEventResultsBare.js").then((m) => ({default: m.getEventsResultsBare, object: m.getEventsResultsBareFromObjects})) : 
    import("../include/getEventResults.js").then((m) => ({default: m.getEventsResults, object: m.getEventsResultsFromObjects}))
)]);

let limiter = new StartGGDelayQueryLimiter();
let data = await aggregateArrayDataPromises([getters.default(client, events, undefined, limiter), eventObjects ? getters.object(client, eventObjects, undefined, limiter) : []]);

limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputFiles, printdata, prettyjson, formattedOutput, fragmentOutput);