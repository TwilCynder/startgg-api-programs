import { addEventParsers, readEventSlugsLists } from "../include/lib/computeEventList.js";
import { getEntrantsCountObjectForEvents } from "../include/getEntrantsCount.js";
import { downloadScript, readFileAndJSONArray } from "../include/downloadScriptFramework.js";

await downloadScript(
    (am) => am
        .apply(addEventParsers),
    async (client, limiter, {eventSlugs, eventsFilenames, inputfile}) => {
        let [events, eventObjects] = await readFileAndJSONArray(readEventSlugsLists(eventSlugs, eventsFilenames), inputfile);
        events = events.concat(eventObjects.filter(event => !!event.slug).map(event => event.slug));
        return await Promise.all(events.map(event => getEntrantsCountObjectForEvents(client, event, limiter, false)));
    }
);

//no obj