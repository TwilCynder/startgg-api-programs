import { ArgumentsManager, parseArguments } from "@twilcynder/arguments-parser";
import { EventListParser } from "./include/lib/computeEventList.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { unmuteStdout, muteStdout } from "./include/lib/jsUtil.js";
import { output, readMultimodalInput } from "./include/lib/util.js";
import { getEntrantsBasicForEvents } from "./include/getEntrantsBasic.js";
import { processUniqueEntrantsLeague } from "./include/uniqueEntrantsUtil.js";

let {list, count, inputfile, stdinput, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
    .addCustomParser(new EventListParser, "list")
    .apply(addInputParams)
    .apply(addOutputParams)
    .addSwitch(["-c", "--count"], {description: "Output the number of unique entrants"})
    .enableHelpParameter()
    .parseProcessArguments();
 
let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let limiter = new StartGGDelayQueryLimiter;
let entrants = await readMultimodalInput(inputfile, stdinput, 
    getEntrantsBasicForEvents(client, list)
);
limiter.stop();

let users = processUniqueEntrantsLeague(entrants);

if (silent_) unmuteStdout();

if (logdata_){
    if (count){
        console.log(users.length)
    } else {
        for (let user of users){
            console.log(user);
            console.log(user.id, user.player.gamerTag);
        }
    }
}

output(outputFormat, outputfile, printdata, count ? users.length : users, (users) => {
    let resultString = "";
    for (let user of users){
        resultString += user.player.gamerTag + "\n";
    }
    return resultString;
});