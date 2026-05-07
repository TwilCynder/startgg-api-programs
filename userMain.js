import { addInputParams, addOutputParams, argumentsManager, doWeLogFromArgs } from "./include/lib/paramConfig.js";
import { getUsersSetsChars } from "./include/getUserSetsChars.js";
import { client } from "./include/lib/client.js";
import { outputFromArgs, readMultimodalArrayInput } from "./include/lib/util.js";
import { processMain } from "./include/getMain.js";
import { PlayerUserFilter } from "./include/processCharacterStatsFiltered.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { loadCharactersInfo } from "./include/loadVideogameContent.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

//======== CONFIGURING PARAMETERS ========
let {slugs, inputfile, number, game, gamefile, percentages, sets_count, allArgs} = argumentsManager()
    .setAbstract("Data expected as input : result of downloadUserSetsChars -i")
    .addMultiParameter("slugs")
    .addOption(["-g", "--game"], {description: "Videogame slug", default: "game/ultimate"})
    .addOption(["-G", "--game-file"], {description: "Path for a file containing character names", dest: "gamefile"})
    .addOption(["-n", "--number"], {description: "Number of characters to include", type: "number", default: 3})
    .addSwitch(["-P", "--percentages"], {description: "Whether to include the percentage of games played on each character"})
    .addOption(["-t", "--sets-count"], {description: "How many sets should be used to compute this (always take most recent, by default takes all)", type: "number"})
    .apply(addInputParams)
    .apply(addOutputParams)
    .enableHelpParameter()
    .parseProcessArguments();


let [logdata, silent] = doWeLogFromArgs(allArgs);
if (silent) muteStdout();

//======== LOADING DATA ========
let limiter = new StartGGDelayQueryLimiter()
let users = await readMultimodalArrayInput(inputfile, getUsersSetsChars(client, slugs, null, {max: sets_count, includeWholeQuery: true}));
let characters = loadCharactersInfo(gamefile, client, limiter, game);
limiter.stop();

//======== PROCESSING DATA ========
if (sets_count){
    users.forEach(user => {
        user.data.sets = user.data.sets.slice(0, sets_count);
    })
}

let result = users.map(user => {
    let mains = processMain(user.data.sets, new PlayerUserFilter(user.data.user.id), number, characters);
    mains.forEach(charData => charData.name = characters[charData.id] ?? "Unknown");
    return {slug: user.slug, name: user.data.user.player.gamerTag, mains};
})

//======== OUTPUT ========
if (silent) unmuteStdout();

if (logdata){
    for (let user of result){
        let line = user.name + " : " + user.mains.map(main => "" + main.name + ` (${(main.percentage * 100).toFixed(2)}%) `).join(" ")
        console.log(line);
    }
}

outputFromArgs(allArgs, result, res => {
    let text = ""
    for (let user of result){
        let line = user.name + "\t" + user.mains.map(main => "" + main.name + (percentages ? `\t${(main.percentage * 100).toFixed(2)}% ` : "")).join("\t")
        text += line + '\n';
    }
    return text;
})