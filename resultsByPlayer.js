import { addEventParsers, readSlugLists } from "./include/lib/computeEventList.js";
import { addInputParams, addOutputParams, argumentsManager, doWeLogFromArgs } from "./include/lib/paramConfig.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { createClientAuto } from "./include/lib/createClient.js";
import { extractSlugs, StartGGDelayQueryLimiter } from "startgg-helper-node";
import { outputFromArgs, readMultimodalArrayInput } from "./include/lib/util.js";
import { getEventsResults } from "./include/getEventResults.js";
import { getResultsByPlayerInline } from "./include/getResultsByPlayer.js";

let {eventSlugs, eventsFilenames, inputfile, allArgs} = argumentsManager()
    .apply(addEventParsers)
    .apply(addInputParams)
    .apply(addOutputParams)
    .enableHelpParameter()
    .setAbstract("Returns standings at a set of events for all players having entered these events. Either specify an event list, or pass event results (with event info) as input")
    .parseProcessArguments()

let [logdata, silent] = doWeLogFromArgs(allArgs);
if (silent) muteStdout();

eventSlugs = await readSlugLists(eventSlugs, eventsFilenames);

let client = await createClientAuto();
let limiter = new StartGGDelayQueryLimiter();

let events = await readMultimodalArrayInput(inputfile, getEventsResults(client, extractSlugs(eventSlugs), undefined, limiter));

let data = getResultsByPlayerInline(events);

if (silent) unmuteStdout();

if (logdata){
    for (const player of data){
        console.log(player.name, ":");
        for (const standing of player.standings){
            console.log("-", standing.placement, "at", standing.eventName);
        }
    }
}

outputFromArgs(allArgs, data, data => {
    let res = "";
    for (const player of data){
        res += player.name + '\t' + player.id + '\t';
        for (const standing of player.standings){
            res += standing.placement + '\t' + standing.eventName + '\t'
        }
        res += '\n';
    }
    return res;
})