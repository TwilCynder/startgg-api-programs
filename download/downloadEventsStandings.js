import { downloadScript } from "../include/downloadScriptFramework.js";
import { addEventParsers, readEventSlugsLists } from "../include/lib/computeEventList.js";
import { aggregateArrayDataPromises, tryReadJSONInput } from "../include/lib/util.js";

await downloadScript(
    (am) => am
        .apply(addEventParsers)
        .addSwitch(["-b", "--bare"], {description: "Fetches standings with bare minimum info, using the EventStandingsBare query instead of EventStanding"}),
    async (client, limiter, {eventSlugs, eventsFilenames, inputfile, bare}) => {
        let [events, eventObjects, getters] = await Promise.all([readEventSlugsLists(eventSlugs, eventsFilenames), tryReadJSONInput(inputfile), (bare ? 
            import("../include/getEventResultsBare.js").then((m) => ({default: m.getEventsResultsBare, object: m.getEventsResultsBareFromObjects})) : 
            import("../include/getEventResults.js").then((m) => ({default: m.getEventsResults, object: m.getEventsResultsFromObjects}))
        )]);

        return await aggregateArrayDataPromises([getters.default(client, events, undefined, limiter), eventObjects ? getters.object(client, eventObjects, undefined, limiter) : []]);
    }
);