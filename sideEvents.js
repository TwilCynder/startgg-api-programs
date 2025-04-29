import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventParsers, readEventLists } from "./include/lib/computeEventList.js";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { output, readMultimodalInput } from "./include/lib/util.js";
import { getOtherEventsFromEvents } from "./include/getOtherEvents.js";
import { client } from "./include/lib/client.js";
import { muteStdout, unmuteStdout } from "./include/lib/jsUtil.js";

let {eventSlugs, eventsFilenames, sideEvents, blacklist, inputfile, stdinput, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
    .apply(addEventParsers)
    .apply(addInputParams)
    .apply(addOutputParams)
    .addSwitch(["-V", "--side-events"], {description: "Exclude the specified events, only include the other events in the tournaments", dest: "sideEvents"})
    .addMultiOption(["-b", "--blacklist"], {description: "Exclude events containing this word"})
    .enableHelpParameter()
    .parseProcessArguments()
    
let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();
 
let events = await readEventLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter();
let data = await readMultimodalInput(inputfile, stdinput, getOtherEventsFromEvents(client, events, limiter));
limiter.stop();

data = data.filter(v => !!v).map(tournament => {
    if (sideEvents){
        tournament.events = tournament.events.filter(event => event.slug != tournament.baseSlug);
    }
    //console.log(tournament)
    tournament.events = tournament.events.filter(event => {
        for (let b of blacklist){
            if (event.slug.includes(b)) return false;
        }
        return true;
    })

    return tournament;
})

if (silent_) unmuteStdout();

if (logdata_){
    for (let tournament of data){
        if (tournament.events.length < 1) continue
        console.log(tournament.tournament.name);
        for (let event of tournament.events){
            console.log("-", event.name);
        }
    }
}

output(outputFormat, outputfile, printdata, data, data => {
    let res = "";
    for (let tournament of data){
        for (let event of tournament.events){
            res += event.slug + '\n';
        }
    }
    return res;
})