import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventFilterParams, addEventGenericFilterParams, addEventOnlineFilterParams, addEventPropertiesFilterParams, addInputParams, addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { addEventParsers, readEventLists } from "../include/lib/computeEventList.js";
import { outputJSON, readArrayInputData } from "../include/lib/util.js";
import { filterEvents, filterEventsFromTournament } from "../include/filterEvents.js";
import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";

let {inputfile, stdinput, eventSlugs, eventsFilenames, exclude_expression, filter, outputfile, printdata, silent, prettyjson, blacklistMode, offline, online, minEntrants} = new ArgumentsManager() 
    .setAbstract("Applies various filters to an array of events (with or without standings). See options to see all awailable filters. Keep in mind that if any events is specified, only these events will be kept ; -B reverses this.")
    .apply(addInputParams)
    .apply(addEventParsers)
    .addSwitch(["-B", "--blacklist-mode"], {dest: "blacklistMode", description: "Treat events as blacklist instead of whitelist"})
    .apply(addEventGenericFilterParams)
    .apply(addEventOnlineFilterParams)
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments()

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent);
if (silent_) muteStdout();

let [data, events] = await Promise.all([
    readArrayInputData(inputfile, stdinput),
    readEventLists(eventSlugs, eventsFilenames)
]);

if (events && events.length){
    data = data.filter(event => {
        for (let slug of events){
            if (slug == event.slug) return !blacklistMode;
        }
        return blacklistMode;
    });    
}

data = filterEventsFromTournament(data, exclude_expression, filter, minEntrants, offline, online);

if (silent_) unmuteStdout();

outputJSON(data, outputfile, printdata, prettyjson);