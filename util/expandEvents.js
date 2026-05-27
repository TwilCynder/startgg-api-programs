import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventParsers, readEventSlugsLists } from "../include/lib/computeEventList.js";
import { argumentsManager } from "../include/lib/paramConfig.js";
import { createClientAuto } from "../include/lib/createClient.js";
import { StartGGDelayQueryLimiter } from "startgg-helper-node";
import { doesEventExist } from "../include/checkEventExistence.js";
import { bgreen, bred } from "../include/lib/consoleUtil.js";

let {eventSlugs, eventsFilenames, number, check, check_detailed} = argumentsManager("Expands a list of events, replacing templates with the full list of events they encompass. Always outputs to stdout.")
    .apply(addEventParsers)
    .addSwitch(["-n", "--number"], {description: "Displays the number of events"})
    .addSwitch(["-c", "--check"], {description: "Only displays events that exist"})
    .addSwitch(["-C", "--check-detailed"], {description: "Displays all events but mark those that don't exist"})
    .enableHelpParameter()
    .parseProcessArguments();

let events = await readEventSlugsLists(eventSlugs, eventsFilenames);

if (check || check_detailed){
    const client = await createClientAuto();
    const limiter = new StartGGDelayQueryLimiter();

    let data = await Promise.all(events.map(async slug => ([slug, await doesEventExist(client, slug, limiter)])));
    limiter.stop();

    if (check_detailed){
        for (const event of data){
            console.log(event[1] ? bgreen("Found") : bred("Not found"), event[0]);
        }
        if (number){
            console.log("Total found :", data.filter(event => !!event[1]).length);
        }
    } else {
        data = data.filter(event => !!event[1]);
        if (number){
            console.log(data.length);
        } else {
            for (const event of data){
                console.log(event[0]);
            }
        }
        
    }
} else {
    if (number){
        console.log(events.length)
    } else {
        for (let event of events){
            console.log(event);
        }
    }
}


