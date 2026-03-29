import { addEventParsers, readSlugLists } from './include/lib/computeEventList.js'
import { getSetsCharsInEvents } from './include/getCharactersInEvent.js';
import { client } from './include/lib/client.js';
import { addInputParams, addOutputParams, argumentsManager, doWeLogFromArgs } from './include/lib/paramConfig.js';
import { outputFromArgs, readMultimodalArrayInput } from './include/lib/util.js';
import { StartGGDelayQueryLimiter } from 'startgg-helper';
import { muteStdout, unmuteStdout } from './include/lib/fileUtil.js';
import { getGamesNbInSets } from './include/getGamesNbInSets.js';


let {eventSlugs, eventsFilenames, inputfile, allArgs} = argumentsManager()
    .apply(addEventParsers)
    .apply(addInputParams)
    .apply(addOutputParams)
    .enableHelpParameter()
    .parseProcessArguments();

let [logdata, silent] = doWeLogFromArgs(allArgs);

if (silent) muteStdout();

let limiter = new StartGGDelayQueryLimiter();

let events = await readSlugLists(eventSlugs, eventsFilenames);
let data = await readMultimodalArrayInput(inputfile, getSetsCharsInEvents(client, events, limiter))

limiter.stop();

let sets = data.length
let games = getGamesNbInSets(data);

if (silent) unmuteStdout();

if (logdata){
    console.log(sets, games);
}

outputFromArgs(allArgs, {games, sets}, (result) => ("" + result.sets + '\t' + result.games))
