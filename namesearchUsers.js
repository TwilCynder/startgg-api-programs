import { ArgumentsManager } from "@twilcynder/arguments-parser";
import {EventListParser} from "./include/lib/computeEventList.js"
import fs from "fs/promises"
import { loadInputFromStdin } from "./include/lib/loadInput.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { fResults, readLinesAsync } from "./include/lib/lib.js";
import { getUniqueUsersOverLeague } from "./include/getEntrants.js";
import { createClient } from "./include/lib/common.js";
import { addInputParams } from "./include/lib/paramConfig.js";

let {inputfile, stdinput, list, names, namesfile, outputfile, outputFormat} = new ArgumentsManager()
    //.addCustomParser(new EventListParser, "list")
    .addMultiParameter("names")
    .addOption(["-f", "--names-file"], {dest: "namesfile"})
    .addOption(["-o", "--output-file"], {dest: "outputfile"})
    .addOption("--format", {dest: "outputFormat", default: "txt"})
    .apply(addInputParams)
    .enableHelpParameter()  
    .parseProcessArguments();

let [results] = await Promise.all([
    Promise.all(fResults(
        async () => {
            if (inputfile){
                return await fs.readFile(inputfile)
                    .then(buf => JSON.parse(buf))
                    .catch(err => {
                        console.warn(`Could not open file ${inputfile} : ${err}`)
                        return [];
                    })
            }
        },
        async () => {
            if (stdinput){
                console.log("-- Waiting for JSON input --");
                return await loadInputFromStdin()
            }
        },
        async () => {
            if (list && list.length > 0){
                let client = createClient();
                let limiter = new StartGGDelayQueryLimiter;
                let events = await getUniqueUsersOverLeague(client, list, limiter);
                limiter.stop();
                return events;
            }
        }
    )),
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

let users = results.reduce((acc, current) => current ? acc.concat(current) : acc, []);

let result = names.map( name => {
    for (let user of users){
        if (name == user.player.gamerTag){
            return {slug: user.slug, name};
        }
    }
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
    let filename = "./out/" + outputfile;
    let file = fs.createWriteStream(filename, {encoding: "utf-8"});

    file.write(resultString);
} else {
    console.log(resultString);
}