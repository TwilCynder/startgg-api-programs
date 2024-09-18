import { ArgumentsManager, parseArguments } from "@twilcynder/arguments-parser";
import { EventListParser } from "./include/lib/computeEventList.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { unmuteStdout, muteStdout } from "./include/lib/jsUtil.js";
import { output, readMultimodalInput } from "./include/lib/util.js";
import { getEntrantsBasicForEvents } from "./include/getEntrantsBasic.js";
import { processUniqueEntrantsLeague } from "./include/uniqueEntrantsUtil.js";
import { getEntrantsExtendedForEvents } from "./include/getEntrantsExtended.js";

let {list, extended, inputfile, stdinput, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
    .addCustomParser(new EventListParser, "list")
    .apply(addInputParams)
    .apply(addOutputParams)
    .addSwitch(["-e", "--extended"], {description: "Fetch pronouns and location info for each user"})
    .enableHelpParameter()
    .parseProcessArguments();
 
let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let limiter = new StartGGDelayQueryLimiter;
let entrants = await readMultimodalInput(inputfile, stdinput, 
    extended ? getEntrantsExtendedForEvents(client, list) : getEntrantsBasicForEvents(client, list)
);
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