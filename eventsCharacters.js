import { parseArguments, OutputModeParser } from '@twilcynder/goombalib-js'
import { EventListParser } from './include/lib/computeEventList.js'
import { getCharsInEvents } from './include/getCharactersInEvent.js';
import { client } from './include/lib/common.js';
import { loadCharacterInfo } from './include/loadCharacterInfo.js';
import fs from 'fs';

try {
    let [outputMode, list] = parseArguments(process.argv.slice(2), new OutputModeParser("stdout"), new EventListParser());


    let [charStats, charNames] = await Promise.all([
        getCharsInEvents(client, list),
        loadCharacterInfo("out/ssbu_chars.json", client, "game/ultimate", true)
    ]);
    
    console.log("charsstat", charStats);
    
    let result = [];
    for (let char in charStats){
        result.push({name: charNames[char], count: charStats[char]})
    }
    result.sort((a, b) => a.count - b.count);
    
    console.log(result);

    for (let char of result){
        console.log(char.name, ":", char.count);
    }

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
} catch (e) {
    console.error("SHIT WENT WRONG")
    console.error(e)
}

console.error("END");   