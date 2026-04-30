import { ArgumentsManager } from "@twilcynder/arguments-parser";
import fs from "fs/promises"
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { readJSONInput, readLinesAsync } from "./include/lib/readUtil.js";
import { getUniqueUsersBasicOverLeague } from "./include/getEntrantsBasic.js";
import { createClient } from "startgg-helper-node";
import { addInputParams, addOutputParams, argumentsManager, doWeLogFromArgs } from "./include/lib/paramConfig.js";
import { addEventParsers, readEventSlugsLists } from "./include/lib/computeEventList.js";
import { output, outputFromArgs, readEventFilterWords, readMultimodalArrayInputWrapper } from "./include/lib/util.js";
import { bgreen, bred, yellow } from "./include/lib/consoleUtil.js"
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
 
let {inputfile, eventSlugs, eventsFilenames, names, namesfile, userDataFile, allArgs} = argumentsManager()
    .apply(addEventParsers)
    .addMultiParameter("names")
    .addOption(["-f", "--names-file"], {dest: "namesfile"})
    .addOption(["-u", "--user-data-file"], {dest: "userDataFile", description: "File containing user data"})
    .apply(addOutputParams)
    .apply(addInputParams)
    .enableHelpParameter()  
    .parseProcessArguments();

let [logdata, silent] = doWeLogFromArgs(allArgs);
if (silent) muteStdout();

let list = await readEventSlugsLists(eventSlugs, eventsFilenames);

let [results, userData] = await Promise.all([
    readMultimodalArrayInputWrapper(inputfile, async () => {
        if (list && list.length > 0){
            let client = createClient();
            let limiter = new StartGGDelayQueryLimiter;
            let events = await getUniqueUsersBasicOverLeague(client, list, limiter);
            limiter.stop();
            return events;
        }
    }),
    userDataFile ? readJSONInput(userDataFile) : [],
    (async () => {
        if (namesfile){
            try {
                let res = await readLinesAsync(namesfile);
                if (!res) throw "Found nothing";

                names = names.concat(res);
                
            } catch (err) {
                console.warn(`Couldn't read names from file ${namesfile} :`, err);
            }
            
        }
    })()
]) 
let users = results.concat(userData);

let result = names.map( (name, i) => {
    for (let user of users){
        if (name == user.player.gamerTag){
            return {slug: user.slug, name};
        }
    }
    console.warn("Could not find a slug for player", yellow(name), "n°", yellow(i + 1));
    return {slug: null, name: name}
})

if (silent) unmuteStdout();

if (logdata){
    for (const user of result){
        console.log("-", user.name, ":", user.slug ? bgreen(user.slug) : bred("Not Found"));
    }
}

outputFromArgs(allArgs, result, (data) => 
    data.map(user => user.slug).join("\n")
); 