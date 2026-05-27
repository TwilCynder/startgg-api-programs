import { addEventParsers, readEventSlugsLists } from './include/lib/computeEventList.js'
import { getSetsCharsDetailedInEvents } from './include/getCharactersInEventsDetailed.js';
import { getCharsStatsInSets, getUpdateFunction } from './include/processCharacterStats.js';
import { client } from './include/lib/client.js';
import { loadCharactersInfo } from './include/loadVideogameContent.js';
import { addInputParams, addOutputParams, argumentsManager, doWeLogFromArgs } from './include/lib/paramConfig.js';
import {  errorExit, outputFromArgs, readMultimodalArrayInput } from './include/lib/util.js';
import { StartGGDelayQueryLimiter } from 'startgg-helper';
import { muteStdout, unmuteStdout } from './include/lib/fileUtil.js';
import { getGamesNbInSets } from './include/getGamesNbInSets.js';
import { cFormat, yellow } from './include/lib/consoleUtil.js';

//======== CONFIGURING PARAMETERS ========
let {charactersInfoFilename, gameSlug, 
    processSets, processPlayers, minGamesPlayer, percentages,
    eventSlugs, eventsFilenames, inputfile, 
    allArgs
} = argumentsManager()
    .apply(addEventParsers)
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
    .addSwitch(["-e", "--sets"], {
        description: "Process character stats for sets as well as games",
        dest: "processSets"
    })
    .addSwitch(["-P", "--players"], {
        description: "Process character stats for individual players",
        dest: "processPlayers"
    })
    .addOption(["--min-player-games"], {
        description: "Minimum number of games for a player to be included in the output",
        dest: "minGamesPlayer",
        type: "number"
    })
    .addSwitch(["-r", "--percentages"], {
        description: "Compute percentages of total games/sets",
    })
    .enableHelpParameter()
    .parseProcessArguments();

if (minGamesPlayer > 0) processPlayers = true;
if (!gameSlug && !charactersInfoFilename){
    errorExit(1, "Neither <charactersInfoFilename> or <gameSlug> were specified (using -f or -g respectively)")
}

let [logdata, silent] = doWeLogFromArgs(allArgs);
if (silent) muteStdout();

//======== LOADING DATA ========
let events = await readEventSlugsLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter();
let [data, charNames] = await Promise.all([
    readMultimodalArrayInput(inputfile, getSetsCharsDetailedInEvents(client, events, limiter)),
    loadCharactersInfo(charactersInfoFilename, client, limiter, gameSlug, true)
])
limiter.stop();

//======== PROCESSING DATA ========
let charStats = getCharsStatsInSets(data, getUpdateFunction(processSets, processPlayers));

let gamesN = percentages ? getGamesNbInSets(data) : null;
let setsN = data.length;

//------- Configuring process functions ---------

const ratio = (val, total) => percentages ? (val / total) : null;
const dp = (n) => yellow((n * 100).toFixed(2));

const finalizeCharDataBase = (charID) => ({name: charNames[charID], games: charStats[charID].games, gamesRatio: ratio(charStats[charID].games, gamesN)});
const finalizeCharDataSets = (charID) => ({name: charNames[charID], games: charStats[charID].games, sets: charStats[charID].sets, gamesRatio: ratio(charStats[charID].games, gamesN), setsRatio: ratio(charStats[charID].sets, setsN)});
const finalizeCharDataPlayers = (charID) => ({name: charNames[charID], games: charStats[charID].games, gamesRatio: ratio(charStats[charID].games, gamesN), sets: charStats[charID].sets, setsRatio: ratio(charStats[charID].sets, setsN), players: Object.values(charStats[charID].players).filter(player => !minGamesPlayer || player.games >= minGamesPlayer).map(player => Object.assign(player, {gamesRatio: ratio(player.games, charStats[charID].games), setsRatio: ratio(player.sets, charStats[charID].sets)})).sort((a, b) => b.games - a.games)})
const finalizeCharDataPlayersSets = finalizeCharDataPlayers;

const logDataBase = (char) => {console.log(char.name, ":", yellow(char.games) + (percentages ? ` (${dp(char.gamesRatio)}%)` : ""))};
const logDataSets = (char) => {console.log(char.name, ":", percentages ? `${yellow(char.games)} (${dp(char.gamesRatio)}%) in ${yellow(char.sets)} sets (${dp(char.setsRatio)}%)` : cFormat(char.games, " in ", char.sets, " sets"))};
const logDataPlayers = (char) => {
    console.log(char.name, ":", yellow(char.games) + (percentages ? `(${dp(char.gamesRatio)}%)` : ""));
    for (let player of char.players){
        console.log(char.name, ":", yellow(player.games) + (percentages ? `(${dp(player.gamesRatio)}%)` : ""));
    }
}
const logDataPlayersSets = (char) => {
    console.log(char.name, ":", percentages ? `${yellow(char.games)} (${dp(char.gamesRatio)}%) in ${yellow(char.sets)} (${dp(char.setsRatio)}%)` : cFormat(char.games, " in ", char.sets, " sets"));
    for (let player of char.players){
        console.log(" -", player.name, ":",percentages ? `${yellow(player.games)} (${dp(player.gamesRatio)}%) in ${yellow(player.sets)} (${dp(player.setsRatio)}%)` : cFormat(player.games, " in ", player.sets, " sets"));
    }
}

const CSVTransformBase = (prev, current) => prev + current.name + "\t" + current.games + '\n';
const CSVTransformSets = (prev, current) => prev + current.name + "\t" + current.games + "\t" + current.games + '\n';
const CSVTransformPlayers = (prev, current) => (prev + current.name + "\t" + current.games + "\t" + current.players.map(player => player.name + "\t" + player.games).join("\t") + '\n');
const CSVTransformPlayersSets = (prev, current) => (prev + current.name + "\t" + current.games + "\t" + current.players.map(player => player.name + "\t" + player.games + "\t" + player.sets).join("\t") + '\n');

//------- Processing ---------

let [finalize, logResult, CSVTransform] =
    processPlayers ?
        (processSets ?
            [finalizeCharDataPlayersSets, logDataPlayersSets, CSVTransformPlayersSets] :
            [finalizeCharDataPlayers, logDataPlayers, CSVTransformPlayers]) :

        (processSets ?
            [finalizeCharDataSets, logDataSets, CSVTransformSets] :
            [finalizeCharDataBase, logDataBase, CSVTransformBase])

let result = [];
for (let char in charStats){
    result.push(finalize(char))
}
result.sort((a, b) => a.games - b.games);

//======== OUTPUT ========
if (silent) unmuteStdout();

if (logdata){
    for (let char of result){
        logResult(char);
    }
}

outputFromArgs(allArgs, result, (result) => result.reduce(CSVTransform, ""))