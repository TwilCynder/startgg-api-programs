import { addEventParsers, readEventSlugsLists } from "../include/lib/computeEventList.js";
import { getUniqueUsersBasicOverLeague } from "../include/getEntrantsBasic.js";
import { downloadScript, readFileAndJSONArray } from "../include/downloadScriptFramework.js";

await downloadScript(
    (am) => am
        .apply(addEventParsers),
    async (client, limiter, {eventSlugs, eventsFilenames, inputfile}) => {
        let [events, eventObjects] = await readFileAndJSONArray(readEventSlugsLists(eventSlugs, eventsFilenames), inputfile);
        events = events.concat(eventObjects.filter (event => !!event.slug).map(event => event.slug));
        return await getUniqueUsersBasicOverLeague(client, events, limiter);
    }
);