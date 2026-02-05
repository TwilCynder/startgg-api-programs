import { addEventParsers, readEventLists } from "../include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addInputParams, addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON, tryReadJSONInput } from "../include/lib/util.js";
import { QueriesProgressManager } from "../include/progressSaver.js";
import { formatM } from "../include/lib/consoleUtil.js";
import { getSetsCharsDetailedInEvents, getSetsCharsDetailedInEventsFromObjects, getSetsCharsDetailedInEventsHashMap, getSetsCharsDetailedInEventsSeparated } from "../include/getCharactersInEventsDetailed.js";

let {eventSlugs, eventsFilenames, inputfile, mode, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .apply(addEventParsers)
    .apply(addInputParams)
    .addSwitch(["-m", "--mode"], {description: `Changes the way sets are organized in the output. Can be either : "${formatM("flat", "underline", "bold")}" (Outputs a single array containing all sets of all events) ; "${formatM("hashmap", "underline", "bold")}" (Outputs a hashmap with an array of sets for each event, with the even slug as key) ; "${formatM("objects", "underline", "bold")}" (Outputs an array of event objects, with two properties : slug and sets) ; "${formatM("arrays", "underline", "bold")}" (default) (Outputs an array of arrays)`})
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

let [events, eventObjects] = await Promise.all([readEventLists(eventSlugs, eventsFilenames), tryReadJSONInput(inputfile)]);

let limiter = new StartGGDelayQueryLimiter();
let progressManager = new QueriesProgressManager("./out/testProgress2.json", {writeThreshold: 100});

let data;
mode = mode ?? (eventObjects.length > 0 && !events.length ? "objects" : "arrays");
if (mode.startsWith("o")){
    eventObjects = eventObjects.concat(events.map(slug => ({slug})));
    data = await getSetsCharsDetailedInEventsFromObjects(client, events, limiter, progressManager);
} else {
    events = events.concat(eventObjects.map(event => event.slug).filter(v=>!!v));
    if (mode.startsWith("a")){
        data = await getSetsCharsDetailedInEventsSeparated(client, events, limiter, progressManager);
    } else if (mode.startsWith("f")){
        data = await getSetsCharsDetailedInEvents(client, events, limiter, progressManager);
    } else {
        data = await getSetsCharsDetailedInEventsHashMap(client, events, limiter, progressManager);
    }
}
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);