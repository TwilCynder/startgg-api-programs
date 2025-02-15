import { client } from "./include/lib/client.js";
import { User } from "./include/user.js"; 
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 
import { addInputParams, addOutputParamsCustom, addUsersParams, isSilent } from "./include/lib/paramConfig.js";
import { addEventParsersSwitchable, readEventLists, SwitchableEventListParser } from "./include/lib/computeEventList.js";
import { muteStdout, readJSONAsync, readLines, unmuteStdout } from "./include/lib/jsUtil.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { loadInputFromStdin } from "./include/lib/loadInputStdin.js";
import { output } from "./include/lib/util.js";
import { getEventsSetsBasic } from "./include/getEventsSets.js";
import { leagueHeadHeadToHeadFromSetsArray } from "./include/leagueHead2Head.js";
import { tryReadUsersFile } from "./include/fetchUserEvents.js";

let {eventSlugs, eventsFilenames, userSlugs, filename, userDataFile, outputFormat, outputfile, printdata, silent, inputfile, stdinput} = new ArgumentsManager()
    .apply(addUsersParams)
    .apply(addEventParsersSwitchable)
    .apply(addOutputParamsCustom(false, true))
    .apply(addInputParams)
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
    Promise.all([
        inputfile ? readJSONAsync(inputfile).catch(err => {
            console.warn(`Could not open file ${inputfile} : ${err}`)
            return [];
        }) : null,

        stdinput ? loadInputFromStdin() : null,

        getEventsSetsBasic(client, events, limiter)
    ]).then(results => results.reduce((previous, current) => current ? previous.concat(current) : previous, []))
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
    
    for (let i = 0; i < matrix.length ; i++){
        result+= '\n' + users[i].name
        for (let j = 0; j < matrix.length; j++){
            if (i == j){
                result += '\tXXXX'
            } else if (i < j){
                let h2h = matrix[i][j - i - 1]
                result += '\t' + h2h[0].score + " - " + h2h[1].score
            } else if (i > j){
                let h2h = matrix[j][i - j - 1]
                result += '\t' + h2h[1].score + " - " + h2h[0].score
            }
        }
    }

    return result;
})