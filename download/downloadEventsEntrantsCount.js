

import { addEventParsers, readEventLists } from "../include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON } from "../include/lib/util.js";
import { getEntrantsCount } from "../include/getEntrantsCount.js";
import { QueriesProgressManager } from "../include/progressSaver.js";

let {eventSlugs, eventsFilenames, inputfile, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .apply(addEventParsers)
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

let [events, eventObjects] = await Promise.all([readEventLists(eventSlugs, eventsFilenames), tryReadJSONInput(inputfile)]);
events = events.concat(eventObjects.filter(event => !!event.slug).map(event => event.slug));

let limiter = new StartGGDelayQueryLimiter();
let progressManager = new QueriesProgressManager("./out/testProgress.json", {writeThreshold: 10});
await progressManager.load();
let data = await Promise.all(events.map(event => getEntrantsCount(client, event, limiter, false, progressManager)));
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);

//no obj