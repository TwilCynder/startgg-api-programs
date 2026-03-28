

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addInputParams, addOutputParamsJSON, argumentsManager, doWePrintFromArgs } from "../include/lib/paramConfig.js";
import { aggregateArrayDataPromises, outputJSONFromArgs, readUsersFile, tryReadJSONInput } from "../include/lib/util.js";
import { getUsersInfo, getUsersInfoFromObjects } from "../include/getUserInfo.js";

let {userSlugs, file, inputfile, allArgs} = argumentsManager()
    .addMultiParameter("userSlugs")
    .addOption(["-f", "--users-file"], {dest: "file", description: "File containing a list of user slugs"})
    .apply(addInputParams)
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

let silent = doWePrintFromArgs(allArgs);

if (silent_) muteStdout();

let [users, userObjects] = await Promise.all([readUsersFile(file, userSlugs), tryReadJSONInput(inputfile)])

let limiter = new StartGGDelayQueryLimiter();
let data = await aggregateArrayDataPromises([getUsersInfo(client, users, limiter), getUsersInfoFromObjects(client, userObjects, limiter)]);
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSONFromArgs(allArgs, data);