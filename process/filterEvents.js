import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventGenericFilterParams, addEventOnlineFilterParams, addInputParams, addInputParamsMandatory, addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { addEventParsers, addEventParsersSwitchable, readEventLists } from "../include/lib/computeEventList.js";
import { outputJSON, readEventFilterWords, tryReadJSONInput } from "../include/lib/util.js";
import { filterEventsFromList, filterEventsFromTournament } from "../include/filterEvents.js";
import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";

let {inputfile, eventSlugs, eventsFilenames, exclude_expression, filter, filterFiles, outputfile, printdata, silent, prettyjson, blacklistMode, offline, online, minEntrants} = new ArgumentsManager() 
    .setAbstract("Applies various filters to an array of events (with or without standings). See options to see all awailable filters. Keep in mind that if any events is specified, only these events will be kept ; -B reverses this.")
    .addParameter("inputfile", {}, true)
    .apply(addEventParsersSwitchable)
    .addSwitch(["-B", "--blacklist-mode"], {dest: "blacklistMode", description: "Treat events as blacklist instead of whitelist"})
    .apply(addEventGenericFilterParams)
    .apply(addEventOnlineFilterParams)
    .apply(addOutputParamsJSON)
    
    .enableHelpParameter()
    .parseProcessArguments()



printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent);
if (silent_) muteStdout();

let [data, events, filters] = await Promise.all([
    tryReadJSONInput(inputfile),
    readEventLists(eventSlugs, eventsFilenames),
    readEventFilterWords(filter, filterFiles)
]);

data = filterEventsFromList(data, events, blacklistMode);
data = filterEventsFromTournament(data, exclude_expression, filters, minEntrants, offline, online);

if (silent_) unmuteStdout();

outputJSON(data, outputfile, printdata, prettyjson);