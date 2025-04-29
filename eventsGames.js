import { addEventParsers, EventListParser, readEventLists } from './include/lib/computeEventList.js'
import { getSetsCharsInEvents } from './include/getCharactersInEvent.js';
import { client } from './include/lib/client.js';
import { addInputParams, addOutputParams, doWeLog } from './include/lib/paramConfig.js';
import { output, readMultimodalInput } from './include/lib/util.js';
import { StartGGDelayQueryLimiter } from './include/lib/queryLimiter.js';
import { ArgumentsManager } from '@twilcynder/arguments-parser';
import { muteStdout, unmuteStdout } from './include/lib/jsUtil.js';

try {
    let {eventSlugs, eventsFilenames, inputfile, stdinput, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
        .apply(addEventParsers)
        .apply(addInputParams)
        .apply(addOutputParams)
        .enableHelpParameter()
        .parseProcessArguments();

    let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

    if (silent_) muteStdout();

    let limiter = new StartGGDelayQueryLimiter();

    let events = await readEventLists(eventSlugs, eventsFilenames);
    let data = await readMultimodalInput(inputfile, stdinput, getSetsCharsInEvents(client, events, limiter))

    limiter.stop();

    let sets = data.length
    let games = 0;
    for (let set of data){
        if (set.games){
            games += set.games.length;
        }
    }
    
    if (silent_) unmuteStdout();
 
    if (logdata_){
        console.log(sets, games);
    }

    output(outputFormat, outputfile, printdata, {games, sets}, (result) => ("" + result.sets + '\t' + result.games))
} catch (e) {
    console.error("AN ERROR HAS OCCURED")
    console.error(e)
}