import fs from "fs";
import { client } from "./include/lib/client.js";
import { getEntrantsCountOverLeague } from "./include/getEntrantsCount.js";
import { addEventParsers, readEventLists } from "./include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser";

let {eventSlugs, eventsFilenames} = new ArgumentsManager()
    .addSwitch(["-s", "--silent"])
    .apply(addEventParsers)
    .enableHelpParameter()
    .parseProcessArguments();

eventSlugs = await readEventLists(eventSlugs, eventsFilenames);
let count = await getEntrantsCountOverLeague(client, eventSlugs);

console.log(count);