import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "../include/lib/queryLimiter.js";

import { muteStdout, unmuteStdout } from "../include/lib/jsUtil.js";
import { addOutputParamsJSON, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON } from "../include/lib/util.js";
import { getVideogameCharacters } from "../include/getVideogameCharacters.js";

let {game, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .addParameter("game")
    .apply(addOutputParamsJSON)
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

let limiter = new StartGGDelayQueryLimiter();
let data = await getVideogameCharacters(client, game, limiter);
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);