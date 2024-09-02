import { parseArguments, OutputModeParser } from '@twilcynder/arguments-parser'
import { EventListParser } from './include/lib/computeEventList.js'
import { client } from './include/lib/client.js';
import fs from 'fs';
import { getEventsSetsBasic } from './include/getEventsSets.js';
import { deep_get } from './include/lib/jsUtil.js';

try {
    let [outputMode, list] = parseArguments(process.argv.slice(2), new OutputModeParser("log"), new EventListParser());

    let sets = await getEventsSetsBasic(client, list);

    let count = 0;

    for (let set of sets){
        if (!set) continue;
        count += 
            deep_get(set.slots[0], "standing.stats.score.value", 0) + 
            deep_get(set.slots[1], "standing.stats.score.value", 0)
    }

    if (outputMode.file){
        let filename = "./out/" + outputMode.file;
        let file = fs.createWriteStream(filename, {encoding: "utf-8"});
    
        file.write(JSON.stringify(result));
    }
    
    switch (outputMode.stdout){
        case "log":
            console.log(count);
            break;
        case "string": 
            console.log(JSON.stringify({count}));
    }
} catch (e) {
    console.error("SHIT WENT WRONG")
    console.error(e)
}

console.error("END");   