import { client } from "./include/lib/client.js";
import { addOutputParamsText, argumentsManager, doWeLog } from "./include/lib/paramConfig.js";
import { loadVideogameContent } from "./include/loadVideogameContent.js";
import { outputTextLazy } from "./include/lib/util.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";

//======== CONFIGURING PARAMETERS ========
let {game, filename, characters, stages, outputfile, printdata, silent, logdata} = argumentsManager()
    .apply(addOutputParamsText)
    .addParameter("game", {description: "start.gg videogame slug (found in a game's page URL)"})
    .addSwitch(["-c", "--characters"], {description: "Display characters info"})
    .addSwitch(["-S", "--stages"], {description: "Display stages info"}) 
    .addOption(["-f", "--filename"], {description: "If specified, the program will try to load the data from this file, and write to it if it wasn't"})
    .enableHelpParameter()

    .parseProcessArguments();

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);
if (silent_) muteStdout();

//======== LOADING DATA ========
let result = await loadVideogameContent(filename, client, null, game, true);

if (!result) {
    console.error("Couldn't load videogame data.");
    process.exit(1);
}



//======== PROCESSING DATA ========
if (!characters && !stages) {
    characters = true;
    stages = true;
}

//======== OUTPUT ========
if (silent_) unmuteStdout();

if (logdata_){
    if (characters){
        console.log("Characters");
        for (let [id, char] of Object.entries(result.characters)){
            console.log("-", char, `(${id})`);
        }
    }
    if (stages){
        console.log("Stages");
        for (let [id, char] of Object.entries(result.stages)){
            console.log("-", char, `(${id})`);
        }
    }
}

outputTextLazy((data) => {
    let res = "";
    if (characters){
        for (let [id, char] of Object.entries(result.characters)){
            res += char + '\t' + id + '\n'
        }
    }
    if (stages){
        for (let [id, char] of Object.entries(result.stages)){
            res += char + '\t' + id + '\n'
        }
    }
    return res;
}, outputfile, printdata, result);