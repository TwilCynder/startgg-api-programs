import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventParsers, readEventLists } from "../include/lib/computeEventList.js";

let {eventSlugs, eventsFilenames} = new ArgumentsManager()
    .apply(addEventParsers)
    .enableHelpParameter()
    .parseProcessArguments();

let events = await readEventLists(eventSlugs, eventsFilenames);

for (let event of events){
    console.log(event);
}