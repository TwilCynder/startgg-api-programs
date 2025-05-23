import { ArgumentsManager } from "@twilcynder/arguments-parser";
import fs from "fs/promises"
import { StartGGDelayQueryLimiter } from "startgg-helper-node";
import { readJSONInput, readLinesAsync } from "./include/lib/readUtil.js";
import { getUniqueUsersBasicOverLeague } from "./include/getEntrantsBasic.js";
import { createClient } from "./include/lib/common.js";
import { addInputParams } from "./include/lib/paramConfig.js";
import { addEventParsers, readEventLists, SwitchableEventListParser } from "./include/lib/computeEventList.js";
import { readMultimodalInputWrapper } from "./include/lib/util.js";

let {inputfile, stdinput, eventSlugs, eventsFilenames, names, namesfile, userDataFile, outputfile, outputFormat} = new ArgumentsManager()
    .apply(addEventParsers)
    .addMultiParameter("names")
    .addOption(["-f", "--names-file"], {dest: "namesfile"})
    .addOption(["-u", "--user-data-file"], {dest: "userDataFile", description: "File containing user data"})
    .addOption(["-o", "--output-file"], {dest: "outputfile"})
    .addOption("--format", {dest: "outputFormat", default: "txt"})
    .apply(addInputParams)
    .enableHelpParameter()  
    .parseProcessArguments();

let list = await readEventLists(eventSlugs, eventsFilenames);

let [results, userData] = await Promise.all([
    readMultimodalInputWrapper(inputfile, stdinput, async () => {
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
                console.warn(`Couldn't read names from file ${namesfile} : ${err}`)
            }
            
        }
    })()
]) 

results = results.concat(userData);

let users = results.reduce((acc, current) => current ? acc.concat(current) : acc, []);

let result = names.map( (name, i) => {
    for (let user of users){
        if (name == user.player.gamerTag){
            return {slug: user.slug, name};
        }
    }
    console.warn("Could not find a slug for player", name, i);
    return {slug: null, name: name}
})

let resultString = ""

if (outputFormat.includes("json")){
    resultString = JSON.stringify(result, null, outputFormat == "prettyjson" ? 4 : undefined);
} else {
    for (let user of result){
        resultString += user.slug + '\n';
    }
}

if (outputfile){
    let filename = outputfile;
    await fs.writeFile(filename, resultString);
} else {
    console.log(resultString);
}   