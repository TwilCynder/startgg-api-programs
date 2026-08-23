import { addEventParsers, readEventSlugsLists } from "../include/lib/computeEventList.js";
import { errorExit, tryReadJSONArray } from "../include/lib/util.js";
import { queriesProgressManager } from "../include/progressSaver.js";
import { formatM } from "../include/lib/consoleUtil.js";
import { downloadScript } from "../include/downloadScriptFramework.js";

/**
 * @typedef {import("../include/getEventsSetsBare.js")} BGM
 * @typedef {{flat: BGM["getEventSetsBare"], object: BGM["getEventsSetsBareFromObjects"], hashmap: BGM["getEventsSetsBareHashmap"], arrays: BGM["getEventsSetsBareSeparated"]}} GettersModule
 * @param {string} path 
 * @param {(m: {}) => GettersModule} bindFunction 
 * @param {string} desc 
 */
function loader(path, bindFunction, desc){
    return {loader: () => import(path).then(bindFunction), desc}
}

const GETTERS_OPTIONS = {
    bare: loader("../include/getEventsSetsBare.js", m => ({flat: m.getEventsSetsBare, object: m.getEventsSetsBareFromObjects, hashmap: m.getEventsSetsBareHashmap, arrays: m.getEventsSetsBareSeparated}), "Only the ID, score and seed for each player"),
    basic: loader("../include/getEventsSets.js", m => ({flat: m.getEventsSetsBasic, object: m.getEventsSetsBasicFromObjects, hashmap: m.getEventsSetsBasicHashmap, arrays: m.getEventsSetsBasicSeparated}), "Adds player names and user slugs"),
    games: loader("../include/getEventsSetsGames.js", m => ({flat: m.getEventsSetsGames, object: m.getEventsSetsGamesFromObjects, hashmap: m.getEventsSetsGamesHashmap, arrays: m.getEventsSetsGamesSeparated}), "Adds individual game winners"),
    chars: loader("../include/getCharactersInEventsDetailed.js", m => ({flat: m.getSetsCharsDetailedInEvents, object: m.getSetsCharsDetailedInEventsFromObjects, hashmap: m.getSetsCharsDetailedInEventsHashMap, arrays: m.getSetsCharsDetailedInEventsSeparated}), "Adds character and stage selection for each game"),
    charsOnly: loader("../include/getCharactersInEvent.js", m => ({flat: m.getSetsCharsInEvents, object: m.getSetsCharsInEventsFromObjects, hashmap: m.getSetsCharsInEventsHashMap, arrays: m.getSetsCharsInEventsSeparated}), "Only character selections, no player info")
}

const gettersDesc = Object.entries(GETTERS_OPTIONS).map(([name, {desc}]) => `${formatM(name, "underline", "bold")} (${desc})`).join(" ; ");

await downloadScript(
    (am) => am
        .apply(addEventParsers)
        .addOption(["-c", "--cache"], {description: "File to use as cache for queries (useful is the program crashes during execution)"})
        .addOption(["--cache-frequency"], {description: "How often does the program write to cache (in number of queries)"})
        .addOption(["-T", "--type"], {description: "What to include in the result : can be " + gettersDesc, default: "basic"})
        .addOption(["-m", "--mode"], {description: `Changes the way sets are organized in the output. Can be either : "${formatM("flat", "underline", "bold")}" (Outputs a single array containing all sets of all events) ; "${formatM("hashmap", "underline", "bold")}" (Outputs a hashmap with an array of sets for each event, with the even slug as key) ; "${formatM("objects", "underline", "bold")}" (Outputs an array of event objects, with two properties : slug and sets) ; "${formatM("arrays", "underline", "bold")}" (default) (Outputs an array of arrays)`}),

    async (client, limiter, {eventSlugs, eventsFilenames, inputfile, mode, type, cache, cache_frequency}) => {
        /** @type {typeof GETTERS_OPTIONS.basic} **/
        const getterOption = GETTERS_OPTIONS[type];
        if (!getterOption){
            const keys = Object.keys(GETTERS_OPTIONS);
            const optionsString = keys.slice(0, -1).join(", ") + " or " + keys.pop();
            errorExit(1, "Invalid type (value of -T/--type argument can only be " + optionsString);
        }

        let [events, eventObjects, getters, progressManager] = await Promise.all([
            readEventSlugsLists(eventSlugs, eventsFilenames), tryReadJSONArray(inputfile), getterOption.loader(), 
            cache ? await queriesProgressManager(cache, {writeThreshold: cache_frequency ?? 100}) : null
        ]);

        let data;
        mode = mode ?? (eventObjects.length > 0 && !events.length ? "objects" : "arrays");
        if (mode.startsWith("o")){
            eventObjects = eventObjects.concat(events.map(slug => ({slug})));
            data = await getters.object(client, eventObjects, limiter, progressManager);
        } else {
            events = events.concat(eventObjects.map(event => event.slug).filter(v=>!!v));
            if (mode.startsWith("a")){
                data = await getters.arrays(client, events, limiter, progressManager);
            } else if (mode.startsWith("f")){
                data = await getters.flat(client, events, limiter, progressManager);
            } else {
                data = await getters.hashmap(client, events, limiter, progressManager);
            }
        }

        return data;
    }
);
