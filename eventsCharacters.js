import { parseArguments, OutputModeParser } from '@twilcynder/goombalib-js'
import { EventListParser } from './include/lib/computeEventList.js'
import { getCharsInEvents } from './include/getCharactersInEvent.js';
import { client } from './include/lib/common.js';
import { loadCharacterInfo } from './include/loadCharacterInfo.js';

try {
    let [outputMode, list] = parseArguments(process.argv.slice(2), new OutputModeParser("stdout"), new EventListParser());
    
    let [charStats, charNames] = await Promise.all([
        getCharsInEvents(client, list),
        loadCharacterInfo("out/ssbu_chars.json", client, "game/ultimate", true)
    ]);
    

    let result = [];
    for (let char in charStats){
        result.push({name: charNames[char], count: charStats[char]})
    }
    result.sort((a, b) => a.count - b.count);
    
    for (let char of result){
        console.log(char.name, ":", char.count);
    }
} catch (e) {
    console.log("Bruh.")
    console.error(e);
}

