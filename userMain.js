import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { getUsersSetsChars } from "./include/getUserSetsChars.js";
import { client } from "./include/lib/client.js";
import { output, readMultimodalInput } from "./include/lib/util.js";
import { processMain } from "./include/getMain.js";
import { PlayerUserFilter } from "./include/processCharacterStatsFiltered.js";
import { muteStdout, unmuteStdout } from "./include/lib/jsUtil.js";
import { loadCharactersInfo } from "./include/loadVideogameContent.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";

let {slugs, inputfile, stdinput, number, game, gamefile, percentages, outputFormat, outputfile, logdata, printdata, silent, all} = new ArgumentsManager()
    .setAbstract("Data expected as input : result of downloadUserSetsChars -i")
    .addMultiParameter("slugs")
    .addOption(["-g", "--game"], {description: "Videogame slug", default: "game/ultimate"})
    .addOption(["-G", "--game-file"], {description: "Path for a file containing character names", dest: "gamefile"})
    .addOption(["-n", "--number"], {description: "Number of characters to include", type: "number", default: 3})
    .addSwitch(["-P", "--percentages"], {description: "Whether to include the percentage of games played on each character"})
    .addOption(["-t", "--sets-count"], {description: "How many sets should be used to compute this (always take most recent, by default takes all)", type: "number"})
    .apply(addInputParams)
    .apply(addOutputParams)
    //.enableRecursiveResult() what ?
    .enableHelpParameter()
    .parseProcessArguments();

let max = all["sets-count"];

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let limiter = new StartGGDelayQueryLimiter()
let users = await readMultimodalInput(inputfile, stdinput, getUsersSetsChars(client, slugs, null, {max, includeWholeQuery: true}));
let characters = loadCharactersInfo(gamefile, client, limiter, game);
limiter.stop();

if (max){
    users.forEach(user => {
        user.data.sets = user.data.sets.slice(0, max);
    })
}

let result = users.map(user => {
    let mains = processMain(user.data.sets, new PlayerUserFilter(user.data.user.id), number, characters);
    mains.forEach(charData => charData.name = characters[charData.id] ?? "Unknown");
    return {slug: user.slug, name: user.data.user.player.gamerTag, mains};
})

if (silent_) unmuteStdout();

if (logdata_){
    for (let user of result){
        let line = user.name + " : " + user.mains.map(main => "" + main.name + ` (${(main.percentage * 100).toFixed(2)}%) `).join(" ")
        console.log(line);
    }
}

output(outputFormat, outputfile, printdata, result, res => {
    let text = ""
    for (let user of result){
        let line = user.name + "\t" + user.mains.map(main => "" + main.name + (percentages ? `\t${(main.percentage * 100).toFixed(2)}% ` : "")).join("\t")
        text += line + '\n';
    }
    return text;
})