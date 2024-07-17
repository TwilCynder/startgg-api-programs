import { EventListParser } from './include/lib/computeEventList.js'
import { getCharsInSets, getSetsCharsInEvents } from './include/getCharactersInEvent.js';
import { client } from './include/lib/client.js';
import { loadCharacterInfo } from './include/loadCharacterInfo.js';
import { addInputParams, addOutputParams, doWeLog } from './include/lib/paramConfig.js';
import { output, readMultimodalInput } from './include/lib/util.js';
import { StartGGDelayQueryLimiter } from './include/lib/queryLimiter.js';
import { ArgumentsManager } from '@twilcynder/arguments-parser';
import { muteStdout, unmuteStdout } from './include/lib/lib.js';

try {
    let {charactersInfoFilename, gameSlug, events, inputfile, stdinput, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
        .addCustomParser(new EventListParser, "events")
        .apply(addInputParams)
        .apply(addOutputParams)
        .addOption(["-f", "--characters-filename"], {
            description: "Path to a json file containing character info. You need to specify either this or charactersInfoFilename.",
            dest: "charactersInfoFilename"
        })
        .addOption(["-g", "--game-slug"], {
            description: "Slug of the videogame to pull character info from. You need to specify either this or charactersInfoFilename.",
            dest: "gameSlug"
        })
        .enableHelpParameter()
        .parseProcessArguments();

    let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

    if (silent_) muteStdout();

    if (!gameSlug && !charactersInfoFilename){
        throw "Neither <charactersInfoFilename> or <gameSlug> were specified (using -s or -f respectively)"
    }

    let limiter = new StartGGDelayQueryLimiter();

    let [data, charNames] = await Promise.all([
        readMultimodalInput(inputfile, stdinput, getSetsCharsInEvents(client, events, limiter)),
        loadCharacterInfo(charactersInfoFilename, client, limiter, gameSlug, true)
    ])

    limiter.stop();


    let charStats = getCharsInSets(data);

    let result = [];
    for (let char in charStats){
        result.push({name: charNames[char], count: charStats[char]})
    }
    result.sort((a, b) => a.count - b.count);
    
    if (silent_) unmuteStdout();
 
    if (logdata_){
        for (let char of result){
            console.log(char.name, ":", char.count);
        }
    }

    output(outputFormat, outputfile, printdata, result, (result) => result.reduce((prev, current) => 
        prev + current.name + "\t" + current.count + '\n'
    ), "")
} catch (e) {
    console.error("AN ERROR HAS OCCURED")
    console.error(e)
}