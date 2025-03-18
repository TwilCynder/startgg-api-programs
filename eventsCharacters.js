import { EventListParser } from './include/lib/computeEventList.js'
import { getSetsCharsDetailedInEvents } from './include/getCharactersInEventsDetailed.js';
import { getCharsStatsInSets, getUpdateFunction } from './include/processCharacterStats.js';
import { client } from './include/lib/client.js';
import { loadCharactersInfo } from './include/loadVideogameContent.js';
import { addInputParams, addOutputParams, doWeLog } from './include/lib/paramConfig.js';
import { output, readMultimodalInput } from './include/lib/util.js';
import { StartGGDelayQueryLimiter } from './include/lib/queryLimiter.js';
import { ArgumentsManager } from '@twilcynder/arguments-parser';
import { muteStdout, unmuteStdout } from './include/lib/jsUtil.js';

try {
    let {charactersInfoFilename, gameSlug, processSets, processPlayers, minGamesPlayer, events, inputfile, stdinput, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
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
        .addSwitch(["--sets"], {
            description: "Process character stats for sets as well as games",
            dest: "processSets"
        })
        .addSwitch(["--players"], {
            description: "Process character stats for individual players",
            dest: "processPlayers"
        })
        .addOption(["--min-player-games"], {
            description: "Minimum number of games for a player to be included in the output",
            dest: "minGamesPlayer",
            type: "number"
        })
        .enableHelpParameter()
        .parseProcessArguments();

    if (minGamesPlayer > 0) processPlayers = true;

    let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

    if (silent_) muteStdout();

    if (!gameSlug && !charactersInfoFilename){
        throw "Neither <charactersInfoFilename> or <gameSlug> were specified (using -s or -f respectively)"
    }

    let limiter = new StartGGDelayQueryLimiter();

    let [data, charNames] = await Promise.all([
        readMultimodalInput(inputfile, stdinput, getSetsCharsDetailedInEvents(client, events, limiter)),
        loadCharactersInfo(charactersInfoFilename, client, limiter, gameSlug, true)
    ])

    limiter.stop();


    let charStats = getCharsStatsInSets(data, getUpdateFunction(processSets, processPlayers));

    //-----------------------------------

    const finalizeCharDataBase = (charID) => ({name: charNames[charID], games: charStats[charID]})
    const finalizeCharDataSets = (charID) => ({name: charNames[charID], games: charStats[charID].games, sets: charStats[charID].sets})
    const finalizeCharDataPlayers = (charID) => ({name: charNames[charID], games: charStats[charID].games, players: Object.values(charStats[charID].players).filter(player => !minGamesPlayer || player.games >= minGamesPlayer).sort((a, b) => b.games - a.games)})
    const finalizeCharDataPlayersSets = finalizeCharDataPlayers;

    const logDataBase = (char) => {console.log(char.name, ":", char.games)};
    const logDataSets = (char) => {console.log(char.name, ":", char.games, "in", char.sets, "sets")};
    const logDataPlayers = (char) => {
        console.log(char.name, ":", char.games)
        for (let player of char.players){
            console.log(" -", player.name, ":", player.games);
        }
    }
    const logDataPlayersSets = (char) => {
        console.log(char.name, ":", char.games)
        for (let player of char.players){
            console.log(" -", player.name, ":", player.games, "games ;", player.sets, "sets");
        }
    }

    const CSVTransformBase = (prev, current) => prev + current.name + "\t" + current.games + '\n';
    const CSVTransformSets = (prev, current) => prev + current.name + "\t" + current.games + "\t" + current.games + '\n';
    const CSVTransformPlayers = (prev, current) => (prev + current.name + "\t" + current.games + "\t" + current.players.map(player => player.name + "\t" + player.games).join("\t") + '\n');
    const CSVTransformPlayersSets = (prev, current) => (prev + current.name + "\t" + current.games + "\t" + current.players.map(player => player.name + "\t" + player.games + "\t" + player.sets).join("\t") + '\n');


    let [finalize, logResult, CSVTransform] =
        processPlayers ?
            (processSets ?
                [finalizeCharDataPlayersSets, logDataPlayersSets, CSVTransformPlayersSets   ] :
                [finalizeCharDataPlayers, logDataPlayers, CSVTransformPlayers]) :

            (processSets ?
                [finalizeCharDataSets, logDataSets, CSVTransformSets] :
                [finalizeCharDataBase, logDataBase, CSVTransformBase])

    let result = [];
    for (let char in charStats){
        result.push(finalize(char))
    }
    result.sort((a, b) => a.games - b.games);

    if (silent_) unmuteStdout();

    if (logdata_){
        for (let char of result){
            logResult(char);
        }
    }

    output(outputFormat, outputfile, printdata, result, (result) => result.reduce(CSVTransform, ""))
} catch (e) {
    console.error("AN ERROR HAS OCCURED")
    console.error(e)
}