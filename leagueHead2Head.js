import { client } from "./include/lib/client.js";
import { User } from "./include/user.js"; 
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 
import { addInputParams, addOutputParamsCustom, addUsersParams, isSilent } from "./include/lib/paramConfig.js";
import { addEventParsersSwitchable, readEventLists } from "./include/lib/computeEventList.js";
import { muteStdout, unmuteStdout } from "./include/lib/jsUtil.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { output, readMultimodalInput } from "./include/lib/util.js";
import { getEventsSetsBasic } from "./include/getEventsSets.js";
import { leagueHeadHeadToHeadFromSetsArray } from "./include/leagueHead2Head.js";
import { tryReadUsersFile } from "./include/fetchUserEvents.js";

let {eventSlugs, eventsFilenames, userSlugs, filename, total, userDataFile, outputFormat, outputfile, printdata, silent, inputfile, stdinput} = new ArgumentsManager()
    .apply(addUsersParams)
    .apply(addEventParsersSwitchable)
    .apply(addOutputParamsCustom(false, true))
    .apply(addInputParams)
    .addSwitch(["-t", "--total"])
    .enableHelpParameter()
    .setMissingArgumentBehavior("Missing argument", 1, false)
    .parseProcessArguments();

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent);

if (silent_) muteStdout();

userSlugs = await tryReadUsersFile(filename, userSlugs);
let events = await readEventLists(eventSlugs, eventsFilenames);

let limiter = new StartGGDelayQueryLimiter;

let [users, sets] = await Promise.all([
    User.createUsersMultimodal(client, userSlugs, limiter, userDataFile),
    readMultimodalInput(inputfile, stdinput, getEventsSetsBasic(client, events, limiter)),
])

limiter.stop();

console.log(sets);

let matrix = leagueHeadHeadToHeadFromSetsArray(sets, users);

if (silent_) unmuteStdout();

output(outputFormat, outputfile, printdata, matrix, (matrix) => {
    let result = "\\\\\\";
    for (let user of users){
        result += '\t' + user.name;
    }
    if (total) {
        result += '\tTotal';
    }
    
    for (let i = 0; i < matrix.length ; i++){
        let wins = 0, losses = 0;

        result+= '\n' + users[i].name;
        for (let j = 0; j < matrix.length; j++){
            if (i == j){
                result += '\tXXXX'
            } else if (i < j){
                let h2h = matrix[i][j - i - 1]
                result += '\t' + h2h[0].score + " - " + h2h[1].score
                wins += h2h[0].score;
                losses += h2h[1].score;
            } else if (i > j){
                let h2h = matrix[j][i - j - 1]
                result += '\t' + h2h[1].score + " - " + h2h[0].score
                wins += h2h[1].score;
                losses += h2h[0].score;
            }
        }

        if (total) {
            result += '\t' + wins + '-' + losses;
        }
    }

    return result;
})