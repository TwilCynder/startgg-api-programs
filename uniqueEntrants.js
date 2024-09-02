import { ArgumentsManager, parseArguments } from "@twilcynder/arguments-parser";
import { EventListParser } from "./include/lib/computeEventList.js";
import { getEntrantsForEvents, getUniqueUsersOverLeague, processUniqueEntrantsLeague } from "./include/getEntrants.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { unmuteStdout, muteStdout } from "./include/lib/jsUtil.js";
import { output, readMultimodalInput } from "./include/lib/util.js";

let {list, inputfile, stdinput, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
    .addCustomParser(new EventListParser, "list")
    .apply(addInputParams)
    .apply(addOutputParams)
    .enableHelpParameter()
    .parseProcessArguments();

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let limiter = new StartGGDelayQueryLimiter;
let entrants = await readMultimodalInput(inputfile, stdinput, getEntrantsForEvents(client, list, limiter))
limiter.stop();

let users = processUniqueEntrantsLeague(entrants);

if (silent_) unmuteStdout();

if (logdata_){
    for (let user of users){
        console.log(user.id, user.player.gamerTag);
    }
}

output(outputFormat, outputfile, printdata, users, (users) => {
    let resultString = "";
    for (let user of users){
        resultString += user.id + "\t" + user.player.gamerTag + "\n";
    }
    return resultString;
});