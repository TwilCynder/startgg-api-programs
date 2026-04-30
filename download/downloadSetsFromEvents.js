import { addEventParsers, readEventSlugsLists } from "../include/lib/computeEventList.js";

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addInputParams, addOutputParamsJSON, argumentsManager, doWePrintFromArgs } from "../include/lib/paramConfig.js";
import { outputJSONFromArgs, tryReadJSONArray } from "../include/lib/util.js";
import { queriesProgressManager } from "../include/progressSaver.js";
import { formatM } from "../include/lib/consoleUtil.js";

const GETTER_LOADERS = {
    basic: () => import("../include/getEventsSets.js").then(m => ({flat: m.getEventsSetsBasic, object: m.getEventsSetsBasicFromObjects, hashmap: m.getEventsSetsBasicHashmap, arrays: m.getEventsSetsBasicSeparated})),
    bare: () => import("../include/getEventsSetsBare.js").then(m => ({flat: m.getEventsSetsBare, object: m.getEventsSetsBareFromObjects, hashmap: m.getEventsSetsBareHashmap, arrays: m.getEventsSetsBareSeparated})),
    games: () => import("../include/getEventsSetsGames.js").then(m => ({flat: m.getEventsSetsGames, object: m.getEventsSetsGamesFromObjects, hashmap: m.getEventsSetsGamesHashmap, arrays: m.getEventsSetsGamesSeparated})),
    chars: () => import("../include/getCharactersInEventsDetailed.js").then(m => ({flat: m.getSetsCharsDetailedInEvents, object: m.getSetsCharsDetailedInEventsFromObjects, hashmap: m.getSetsCharsDetailedInEventsHashMap, arrays: m.getSetsCharsDetailedInEventsSeparated})),
    charsOnly: () => import("../include/getCharactersInEvent.js").then(m => ({flat: m.getSetsCharsInEvents, object: m.getSetsCharsInEventsFromObjects, hashmap: m.getSetsCharsInEventsHashMap, arrays: m.getSetsCharsInEventsSeparated}))
}

let {eventSlugs, eventsFilenames, inputfile, mode, type, cache, cache_frequency, allArgs} = argumentsManager()
    .setParameters({guessLowDashes: true})
    .apply(addEventParsers)
    .apply(addInputParams)
    .addOption(["-c", "--cache"], {description: "File to use as cache for queries (useful is the program crashes during execution)"})
    .addOption(["--cache-frequency"], {description: "How often does the program write to cache (in number of queries)"})
    .addOption(["-T", "--type"], {description: `What to include in the result : can be "${formatM("bare", "underline", "bold")}" (Only the ID, score and seed for each player)" ; ${formatM("basic", "underline", "bold")}" (Adds player names and user slugs) ; "${formatM("games", "underline", "bold")}" (Adds individual game winners) ; "${formatM("chars", "underline", "bold")} (Adds character and stage selection for each game)" ; "${formatM("charsOnly", "underline", "bold")}" (Only character selections, no player info)`, default: "basic"})
    .addOption(["-m", "--mode"], {description: `Changes the way sets are organized in the output. Can be either : "${formatM("flat", "underline", "bold")}" (Outputs a single array containing all sets of all events) ; "${formatM("hashmap", "underline", "bold")}" (Outputs a hashmap with an array of sets for each event, with the even slug as key) ; "${formatM("objects", "underline", "bold")}" (Outputs an array of event objects, with two properties : slug and sets) ; "${formatM("arrays", "underline", "bold")}" (default) (Outputs an array of arrays)`})
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

let silent = doWePrintFromArgs(allArgs);

if (silent) muteStdout();

/** @type {typeof GETTER_LOADERS.basic} */
const getterLoader = GETTER_LOADERS[type];
if (!getterLoader){
    console.error("Invalid type (value of -T/--type argument can only be bare, basic, chars, charsOnly or games");
    process.exit(1);
}

let [events, eventObjects, getters] = await Promise.all([readEventSlugsLists(eventSlugs, eventsFilenames), tryReadJSONArray(inputfile), getterLoader()]);

let limiter = new StartGGDelayQueryLimiter();
let progressManager = cache ? await queriesProgressManager(cache, {writeThreshold: cache_frequency ?? 100}) : null;

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
limiter.stop();

if (silent) unmuteStdout();

outputJSONFromArgs(allArgs, data);