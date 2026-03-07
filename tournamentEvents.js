import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventParsers, readSlugLists } from "./include/lib/computeEventList.js";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { output, readMultimodalArrayInput } from "./include/lib/util.js";
import { getOtherEventsFromEvent, getOtherEventsFromEvents } from "./include/getOtherEvents.js";
import { client } from "./include/lib/client.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { getEventsInTournament } from "./include/getEventsInTournament.js";

let {eventSlugs, eventsFilenames, sideEvents, blacklist, inputfile, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
    .setParameters({guessLowDashes: true})
    .setAbstract("Returns the full list of events for a set of tournaments. Also accepts events as input, returning the events at the tournaments they belong to.")
    .apply(addEventParsers)
    .apply(addInputParams)
    .apply(addOutputParams)
    .addSwitch(["-V", "--side-events"], {description: "Exclude the specified events, only include the other events in the tournaments", dest: "sideEvents"})
    .addMultiOption(["-b", "--blacklist"], {description: "Exclude events containing this word"})
    .enableHelpParameter()
    .parseProcessArguments()
    
let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();
 
let events = await readSlugLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter();
let data = await readMultimodalArrayInput(inputfile, Promise.all(events.map(slug => {
    if (slug.includes("/event/")){
        return getOtherEventsFromEvent(client, slug, limiter, false)
    } else {
        return getEventsInTournament(client, slug, limiter, false);
    }
})));
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
        console.log(tournament.name);
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