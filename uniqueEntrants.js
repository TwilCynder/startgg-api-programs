import { ArgumentsManager, parseArguments } from "@twilcynder/arguments-parser";
import { EventListParser } from "./include/lib/computeEventList.js";
import { getUniqueUsersOverLeague } from "./include/getEntrants.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import fs from "fs"
import { addOutputParams } from "./include/lib/paramConfig.js";

let {list, outputFormat, outputfile, logdata} = new ArgumentsManager()
    .addCustomParser(new EventListParser, "list")
    .apply(addOutputParams)
    .enableHelpParameter()
    .parseProcessArguments();


let limiter = new StartGGDelayQueryLimiter;
let users = await getUniqueUsersOverLeague(client, list, limiter);
limiter.stop();

if (logdata){
    for (let user of users){
        console.log(user.id, user.player.gamerTag);
    }
}

let resultString = ""
if (outputFormat == "csv"){
    for (let user of users){
        resultString += user.id + "\t" + user.player.gamerTag + "\n";
    }
} else {
    resultString = JSON.stringify(users, null, outputFormat == "prettyjson" ? 4 : undefined);
}

if (outputfile){
    let filename = "./out/" + outputfile;
    let file = fs.createWriteStream(filename, {encoding: "utf-8"});

    file.write(resultString);
} else {
    console.log(resultString);
}