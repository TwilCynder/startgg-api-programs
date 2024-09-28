import fs from "fs";
import { client } from "./include/lib/client.js";
import { getEntrantsCountOverLeague } from "./include/getEntrantsCount.js";
import { computeEventList, EventListParser } from "./include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser";

let {list, silent} = new ArgumentsManager()
    .addSwitch(["-s", "--silent"])
    .addCustomParser(new EventListParser, "list")
    .enableHelpParameter()
    .parseProcessArguments();

let count = await getEntrantsCountOverLeague(client, list);

console.log(count);