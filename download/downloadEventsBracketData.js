import { addEventParsers, readEventSlugsLists } from "../include/lib/computeEventList.js";
import { aggregateArrayDataPromises } from "../include/lib/util.js";
import { getEventsBracketData, getEventsBracketDataFromObjects } from "../include/getEventBracketData.js";
import { downloadScript, readFileAndJSONArray } from "../include/downloadScriptFramework.js";

await downloadScript(
    (am) => am
        .apply(addEventParsers),
    async (client, limiter, {eventSlugs, eventsFilenames, inputfile}) => {
        let [events, eventObjects] = await readFileAndJSONArray(readEventSlugsLists(eventSlugs, eventsFilenames), inputfile);
        return await aggregateArrayDataPromises([getEventsBracketData(client, events, undefined, limiter), eventObjects ? getEventsBracketDataFromObjects(client, eventObjects, undefined, limiter) : []]);
    }
)