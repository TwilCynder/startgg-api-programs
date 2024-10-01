import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addInputParams, addOutputParams } from "./include/lib/paramConfig.js";
import { getUsersSetsChars } from "./include/getUserSetsChars.js";
import { client } from "./include/lib/client.js";
import { readMultimodalInput } from "./include/lib/util.js";
import { processMain } from "./include/getMain.js";
import { PlayerUserFilter } from "./include/processCharacterStatsFiltered.js";
import { getVideogameCharacters } from "./include/getVideogameCharacters.js";
import { readJSONAsync } from "./include/lib/jsUtil.js";

let {slugs, inputfile, stdinput, number, game, gamefile, outputFormat, outputfile, logdata, printdata, silent, all} = new ArgumentsManager()
    .setAbstract("Data expected as input : result of downloadUserSetsChars -i")
    .addMultiParameter("slugs")
    .addOption(["-g", "--game"], {description: "Videogame slug", default: "game/ultimate"})
    .addOption(["-G", "--game-file"], {description: "Path for a file containing character names", dest: "gamefile"})
    .addOption(["-n", "--number"], {description: "Number of characters to include", type: "number", default: 3})
    .addSwitch(["-p", "--percentages"], {description: "Whether to include the percentage of games played on each character"})
    .addOption(["-t", "--sets-count"], {description: "How many sets should be used to compute this (always take most recent, by default takes all)", type: "number"})
    .apply(addInputParams)
    .apply(addOutputParams)
    .enableRecursiveResult()
    .enableHelpParameter()
    .parseProcessArguments();

let max = all["sets-count"];

let users = await readMultimodalInput(inputfile, stdinput, getUsersSetsChars(client, slugs, null, {max, includeWholeQuery: true}));
let characters = gamefile ? await readJSONAsync(gamefile) : await getVideogameCharacters(client, game, null);

if (max){
    users.forEach(user => {
        user.data.user.sets = user.data.user.sets.slice(0, max);
    })
}

if (characters){
    characters = characters.reduce((prev, {id, name}) => {prev[id] = name ; return prev}, {});
}

let result = users.map(user => ({
    slug: user.slug, 
    mains: processMain(user.data.user.sets, new PlayerUserFilter(user.data.user.id), number, characters)
}))

for (let user of result){
    console.log(user.mains);
}