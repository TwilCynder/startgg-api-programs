import { getEventsSetsBasic, getEventsSetsBasicHashmap } from "../include/getEventsSets.js";

import { EventListParser } from "../include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "../include/lib/queryLimiter.js";

import { muteStdout, unmuteStdout } from "../include/lib/lib.js";
import { addOutputParamsBasic, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON } from "../include/lib/util.js";

let {events, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .addCustomParser(new EventListParser, "events")
    .apply(addOutputParamsBasic)
    .addSwitch(["-r", "--readable-json"], {description: "Makes the JSON output human-readable", dest: "prettyjson"})
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

console.log(events);

let limiter = new StartGGDelayQueryLimiter();
let data = await getEventsSetsBasicHashmap(client, events, limiter);
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);