import { ArgumentsManager } from "@twilcynder/arguments-parser";
import {EventListParser} from "./include/lib/computeEventList.js"
import fs from "fs/promises"
import { loadInputFromStdin } from "./include/lib/loadInput.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { fResults } from "./include/lib/lib.js";

let {inputfile, stdininput: stdinput, list} = new ArgumentsManager()
    .addCustomParser(new EventListParser, "list")
    .addOption(["-i", "--input-file"], {dest: "inputfile"})
    .addSwitch(["-s", "--stdin-input"], {dest: "stdininput"})
    .parseProcessArguments();

let results = await Promise.all(fResults(
    async () => {
        if (inputfile){
            return await fs.readFile()
                .then(buf => buf.toJSON)
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
        if (list && !list.length > 0){
            let client
            let limiter = new StartGGDelayQueryLimiter;
            await getUniqueUsersOverLeague(client, list, limiter);
        }
    }
))

console.log(results);