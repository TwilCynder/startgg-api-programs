import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventNameFilterParams, addInputParams, addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { addEventParsers, readEventLists } from "../include/lib/computeEventList.js";
import { outputJSON, readInputData } from "../include/lib/util.js";
import { filterEvents } from "../include/filterEvents.js";
import { muteStdout, unmuteStdout } from "../include/lib/jsUtil.js";

let {inputfile, stdinput, eventSlugs, eventsFilenames, exclude_expression, filter, outputfile, printdata, silent, prettyjson} = new ArgumentsManager() 
    .apply(addInputParams)
    .apply(addEventParsers)
    .apply(addEventNameFilterParams)
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments()

    printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent);
if (silent_) muteStdout();

let [data, events] = await Promise.all([
    readInputData(inputfile, stdinput),
    readEventLists(eventSlugs, eventsFilenames)
]);

if (events && events.length){
    data = data.filter(event => {
        for (let slug of events){
            if (slug == event.slug) return true;
        }
        return false;
    });
    
    console.log(data);
}

data = filterEvents(data, exclude_expression, filter);

if (silent_) unmuteStdout();

outputJSON(data, outputfile, printdata, prettyjson);