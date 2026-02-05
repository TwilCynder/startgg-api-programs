
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addInputParams, addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON } from "../include/lib/util.js";
import { getUsersSetsChars, getUserSetsCharsFromObjects } from "../include/getUserSetsChars.js";

let {userSlugs, file, inputfile, setscount, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .addMultiParameter("userSlugs")
    .addOption(["-f", "--users-file"], {dest: "file", description: "File containing a list of user slugs"})
    .apply(addInputParams)
    .apply(addOutputParamsJSON)
    .addOption(["-S", "--sets-count"], {description: "How many sets to fetch for each user (always take most recent, by default takes all)", dest: "setscount", type: "number"})
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

let [users, userObjects] = await Promise.all([readUsersFile(file, userSlugs), tryReadJSONInput(inputfile)])

let limiter = new StartGGDelayQueryLimiter();
let data = await aggregateArrayDataPromises([getUsersSetsChars(client, users, limiter), getUserSetsCharsFromObjects(client, userObjects, limiter)]);
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);