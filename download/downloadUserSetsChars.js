
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper-node";

import { muteStdout, unmuteStdout } from "startgg-helper-node";
import { addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON } from "../include/lib/util.js";
import { getUsersSetsChars } from "../include/getUserSetsChars.js";

let {slugs, setscount, includeWholeQuery, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .addMultiParameter("slugs")
    .apply(addOutputParamsJSON)
    .addSwitch(["-i", "--include-whole-query"], {description: "Include the whole query hierarchy in the result and not just the sets array. Result will include slug, id, pronouns and location info for the user", dest: "includeWholeQuery"})
    .addOption(["-S", "--sets-count"], {description: "How many sets to fecth for each user (always take most recent, by default takes all)", dest: "setscount", type: "number"})
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

let limiter = new StartGGDelayQueryLimiter();
let data = await getUsersSetsChars(client, slugs, limiter, {max: setscount, includeWholeQuery});
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);