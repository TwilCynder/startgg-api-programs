import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { muteStdout, unmuteStdout } from "../include/lib/fileUtil.js";
import { addOutputParamsJSON, argumentsManager, doWePrintFromArgs } from "../include/lib/paramConfig.js";
import { outputJSONFromArgs } from "../include/lib/util.js";
import { loadVideogameContent } from "../include/loadVideogameContent.js";

let {game, allArgs} = argumentsManager()
    .addParameter("game")
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

let silent = doWePrintFromArgs(allArgs);
if (silent) muteStdout();

let limiter = new StartGGDelayQueryLimiter();
let data = await loadVideogameContent(null, client, limiter, game);
limiter.stop();

if (silent){
    unmuteStdout();
}

outputJSONFromArgs(allArgs, data);