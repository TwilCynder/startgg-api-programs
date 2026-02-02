import { addEventParsers, readEventLists } from "../include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON } from "../include/lib/util.js";
import { QueriesProgressManager } from "../include/progressSaver.js";
import { getEventsSetsBare } from "../include/getEventsSetsBare.js";

let {eventSlugs, eventsFilenames, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .apply(addEventParsers)
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

let events = await readEventLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter();
let progressManager = new QueriesProgressManager("./out/testProgress2.json", {writeThreshold: 100});
let data = await getEventsSetsBare(client, events, limiter, progressManager);
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);