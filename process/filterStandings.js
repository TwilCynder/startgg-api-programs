import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addInputParams, addOutputParamsJSON } from "../include/lib/paramConfig";
import { addEventParsers, readEventLists } from "../include/lib/computeEventList";
import { readInputData } from "../include/lib/util";

let {inputfile, stdinput, eventSlugs, eventsFilenames, outputfile, printdata, silent, prettyjson} = new ArgumentsManager() 
    .apply(addInputParams)
    .apply(addEventParsers)
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments()

let data = await readInputData(inputfile, stdinput);
let events = await readEventLists(eventSlugs, eventsFilenames);

data = data.filter(event => {
    for (let slug of events){
        if (slug == event.slug) return true;
    }
    return false;
});

console.log(data);