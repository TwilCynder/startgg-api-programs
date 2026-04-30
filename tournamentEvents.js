import { addEventParsers, readEventSlugsLists } from "./include/lib/computeEventList.js";
import { addInputParams, addOutputParams, argumentsManager, doWeLogFromArgs } from "./include/lib/paramConfig.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { outputFromArgs, readMultimodalArrayInput } from "./include/lib/util.js";
import { getOtherEventsFromEvent } from "./include/getOtherEvents.js";
import { client } from "./include/lib/client.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { getEventsInTournament } from "./include/getEventsInTournament.js";

let {eventSlugs, eventsFilenames, sideEvents, blacklist, inputfile, allArgs} = argumentsManager()
    .setParameters({guessLowDashes: true})
    .setAbstract("Returns the full list of events for a set of tournaments. Also accepts events as input, returning the events at the tournaments they belong to.")
    .apply(addEventParsers)
    .apply(addInputParams)
    .apply(addOutputParams)
    .addSwitch(["-V", "--side-events"], {description: "Exclude the specified events, only include the other events in the tournaments", dest: "sideEvents"})
    .addMultiOption(["-b", "--blacklist"], {description: "Exclude events containing this word"})
    .enableHelpParameter()
    .parseProcessArguments()
    
let [logdata, silent] = doWeLogFromArgs(allArgs);
if (silent) muteStdout();
 
let events = await readEventSlugsLists(eventSlugs, eventsFilenames);

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

if (silent) unmuteStdout();

if (logdata){
    for (let tournament of data){
        if (tournament.events.length < 1) continue
        console.log(tournament.name);
        for (let event of tournament.events){
            console.log("-", event.name);
        }
    }
}

outputFromArgs(allArgs, data, data => {
    let res = "";
    for (let tournament of data){
        for (let event of tournament.events){
            res += event.slug + '\n';
        }
    }
    return res;
})