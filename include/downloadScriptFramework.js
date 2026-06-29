import { addEventParsers, readEventSlugsLists } from "../include/lib/computeEventList.js";

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addInputParams, addOutputParamsJSON, argumentsManager, doWePrintFromArgs } from "../include/lib/paramConfig.js";
import { aggregateArrayDataPromises, outputJSONFromArgs, tryReadJSONArray, tryReadJSONInput } from "../include/lib/util.js";
import { getEntrantsBasicForEvents, getEntrantsBasicFromObjects } from "../include/getEntrantsBasic.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser";

/**
 * @param {(am: ArgumentsManager) => void} parametersConfig 
 * @param {(args: {}) => Promise<any>} downloadFunction 
 */
export async function downloadScript(parametersConfig, downloadFunction){
    let {allArgs} = argumentsManager()
        .apply(addInputParams)
        .apply(addOutputParamsJSON)
        .apply(parametersConfig)

        .parseProcessArguments();

    let silent = doWePrintFromArgs(allArgs)
    if (silent) muteStdout();

    let limiter = new StartGGDelayQueryLimiter();

    const data = await downloadFunction(client, limiter, allArgs);

    limiter.stop();

    if (silent){
        unmuteStdout();
    }

    outputJSONFromArgs(allArgs, data);
}

/**
 * 
 * @param {Promise<any[]>} slugReadPromise
 * @param {string?} inputfile
 */
export async function readSlugsAndObjects(slugReadPromise, inputfile){
    return await Promise.all([slugReadPromise, tryReadJSONArray(inputfile)]);
}