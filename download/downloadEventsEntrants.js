import { addEventParsers, readEventSlugsLists } from "../include/lib/computeEventList.js";
import { getEntrantsBasicForEvents, getEntrantsBasicFromObjects } from "../include/getEntrantsBasic.js";
import { downloadScript, readFileAndJSONArray } from "../include/downloadScriptFramework.js";
import { aggregateArrayDataPromises } from "../include/lib/util.js";

await downloadScript(
    (am) => am
        .apply(addEventParsers),
    async (client, limiter, {eventSlugs, eventsFilenames, inputfile}) => {
        let [events, eventObjects] = await readFileAndJSONArray(readEventSlugsLists(eventSlugs, eventsFilenames), inputfile);
        return await aggregateArrayDataPromises([getEntrantsBasicForEvents(client, events, undefined, limiter), eventObjects ? getEntrantsBasicFromObjects(client, eventObjects, undefined, limiter) : []]);
    }
)