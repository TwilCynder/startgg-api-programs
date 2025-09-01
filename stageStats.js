import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { output, readMultimodalArrayInput } from "./include/lib/util.js";
import { getSetsCharsInEvents } from "./include/getCharactersInEvent.js";
import { addEventParsers, readEventLists } from "./include/lib/computeEventList.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { loadStagesInfo } from "./include/loadVideogameContent.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";

let {eventSlugs, eventsFilenames, inputfile, stdinput, game, stagesfile, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
    .addMultiParameter("eventSlugs")
    .addOption("--stages-filename", {dest: "stagesFile"})
    .addOption(["-g", "--game"])
    .addOption(["-G", "--game-file"], {dest: "stagesfile"})
    .apply(addEventParsers)
    .apply(addInputParams)
    .apply(addOutputParams)
    .enableHelpParameter()
    .parseProcessArguments();

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let events = await readEventLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter();
let data = await readMultimodalArrayInput(inputfile, stdinput, getSetsCharsInEvents(client, events, limiter));
let stages = await loadStagesInfo(stagesfile, client, limiter, game, true);
limiter.stop();

let stats = {};

for (let set of data){
    if (!set.games) continue
    for (let game of set.games){
        if (!game.stage) continue;
        let id = game.stage.id;
        if (stats[id]){
            stats[id]++;
        } else {
            stats[id] = 1;
        }
    }
}

let list = Object.entries(stats).map(([id, count]) => ({name: stages[id], id, count}));
let total = list.reduce((prev, curr) => prev + curr.count, 0)

list.sort((a, b) => b.count - a.count);
list.forEach(stage => stage.ratio = stage.count / total);

if (silent_) unmuteStdout();

if (logdata_){
    for (let stage of list){
        console.log(stage.name, `${stage.count} (${(stage.ratio * 100).toFixed(2)}%)`);
    }
}


output(outputFormat, outputfile, printdata, list, list => {
    let res = "";
    for (let stage of list){
        res += stage.name + '\t' + stage.count + '\t' + stage.ratio + "%\n";
    }
    return res;
})