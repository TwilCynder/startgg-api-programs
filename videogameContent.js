import { client } from "./include/lib/client.js";
import { getVideogameContent } from "./include/getVideogameContent.js";
import {Parser, parseArguments, OutputModeParser, ArgumentsManager} from '@twilcynder/arguments-parser'
import fs from 'fs'
import { addOutputParamsBasic } from "./include/lib/paramConfig.js";

let [outputMode, slug] = parseArguments(process.argv.slice(2), 
    new OutputModeParser("log"),
    new class extends Parser {
        parse(args, i){
            if (this._state) console.warn("Multiple slugs given; only the last one will be processed");
            this._state = args[i];
        }
    }
)

let {characters, stages, outputfile, printdata, silent} = new ArgumentsManager()
    .apply(addOutputParamsBasic)

if (!slug){
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " slug [-o file]");
    process.exit(1);
}

let result = await getVideogameContent(client, slug)

if (!result) {
    console.error("No result, request failed");
    process.exit(2);
} else if (!result.videogame) {
    console.error("Videogame not found");
    process.exit(3);
}

result = result.videogame.characters;

if (outputMode.file){
    let filename = "./out/" + outputMode.file;
    let file = fs.createWriteStream(filename, {encoding: "utf-8"});

    file.write(JSON.stringify(result));
}

switch (outputMode.stdout){
    case "log":
        console.log(result);
        break;
    case "string": 
        console.log(JSON.stringify(result));
}