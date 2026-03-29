import { addEventGenericFilterParams, addEventOnlineFilterParams, addOutputParamsJSON, argumentsManager, doWePrintFromArgs } from "../include/lib/paramConfig.js";
import { addEventParsersSwitchable, readSlugLists } from "../include/lib/computeEventList.js";
import { outputJSONFromArgs, readEventFilterWords, tryReadJSONInput } from "../include/lib/util.js";
import { filterEventsFromList, filterEventsFromTournament } from "../include/filterEvents.js";
import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";

let {inputfile, eventSlugs, eventsFilenames, exclude_expression, filter, filterFiles, blacklistMode, offline, online, minEntrants, allArgs} = argumentsManager()
    .setAbstract("Applies various filters to an array of events (with or without standings). See options to see all awailable filters. Keep in mind that if any events is specified, only these events will be kept ; -B reverses this.")
    .addParameter("inputfile", {}, true)
    .apply(addEventParsersSwitchable)
    .addSwitch(["-B", "--blacklist-mode"], {dest: "blacklistMode", description: "Treat events as blacklist instead of whitelist"})
    .apply(addEventGenericFilterParams)
    .apply(addEventOnlineFilterParams)
    .apply(addOutputParamsJSON)
    
    .enableHelpParameter()
    .parseProcessArguments()

let silent = doWePrintFromArgs(allArgs);
if (silent) muteStdout();

let [data, events, filters] = await Promise.all([
    tryReadJSONInput(inputfile),
    readSlugLists(eventSlugs, eventsFilenames),
    readEventFilterWords(filter, filterFiles)
]);

data = filterEventsFromList(data, events, blacklistMode);
data = filterEventsFromTournament(data, exclude_expression, filters, minEntrants, offline, online);

if (silent) unmuteStdout();

outputJSONFromArgs(allArgs, data);