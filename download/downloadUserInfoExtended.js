

import { ArgumentsManager } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/client.js";
import { StartGGDelayQueryLimiter } from "../include/lib/queryLimiter.js";

import { muteStdout, readLinesAsync, unmuteStdout } from "../include/lib/jsUtil.js";
import { addOutputParamsBasic, isSilent } from "../include/lib/paramConfig.js";
import { outputJSON } from "../include/lib/util.js";
import { getUsersInfoExtended } from "../include/getUserInfoExtended.js";

let {userSlugs, file, outputfile, printdata, silent, prettyjson} = new ArgumentsManager()
    .addMultiParameter("userSlugs")
    .addOption(["-f", "--users-file"], {dest: "file", description: "File containing a list of user slugs"})
    .apply(addOutputParamsBasic)
    .addSwitch(["-r", "--readable-json"], {description: "Makes the JSON output human-readable", dest: "prettyjson"})
    .enableHelpParameter()
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)

if (silent_) muteStdout();

if (file){
    let lines = await readLinesAsync(file);
    if (lines && lines.length){
        userSlugs = userSlugs.concat(lines.filter(line => !!line && line != "null" && line != "undefined").map(line => line.trim()));
    }
}

let limiter = new StartGGDelayQueryLimiter();
let data = await getUsersInfoExtended(client, userSlugs, limiter);
limiter.stop();

if (silent_){
    unmuteStdout();
}

outputJSON(data, outputfile, printdata, prettyjson);