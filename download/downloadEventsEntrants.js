import { addEventParsers, readEventSlugsLists } from "../include/lib/computeEventList.js";
import { getEntrantsBasicForEvents, getEntrantsBasicFromObjects } from "../include/getEntrantsBasic.js";
import { downloadScript, readSlugsAndObjects } from "../include/downloadScriptFramework.js";
import { aggregateArrayDataPromises } from "../include/lib/util.js";

/*
let {eventSlugs, eventsFilenames, inputfile, allArgs} = argumentsManager()
    .apply(addEventParsers)
    .apply(addInputParams)
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
*/

await downloadScript(
    (am) => am
        .apply(addEventParsers),
    async (client, limiter, {eventSlugs, eventsFilenames, inputfile}) => {
        let [events, eventObjects] = await readSlugsAndObjects(readEventSlugsLists(eventSlugs, eventsFilenames), inputfile);
        return await aggregateArrayDataPromises([getEntrantsBasicForEvents(client, events, undefined, limiter), eventObjects ? getEntrantsBasicFromObjects(client, eventObjects, undefined, limiter) : []]);
    }
)