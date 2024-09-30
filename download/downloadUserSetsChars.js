
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "../include/lib/queryLimiter.js";

import { muteStdout, unmuteStdout } from "../include/lib/jsUtil.js";
import { addOutputParamsBasic, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON } from "../include/lib/util.js";
import { getUsersSetsChars } from "../include/getUserSetsChars.js";

let {slugs, setscount, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .addMultiParameter("slugs")
    .apply(addOutputParamsBasic)
    .addOption(["-S", "--sets-count"], {description: "How many sets should be used to compute this (always take most recent, by default takes all)", dest: "setscount", type: "number"})
    .addSwitch(["-r", "--readable-json"], {description: "Makes the JSON output human-readable", dest: "prettyjson"})
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

let limiter = new StartGGDelayQueryLimiter();
let data = await getUsersSetsChars(client, slugs, limiter, setscount ?? undefined);
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);