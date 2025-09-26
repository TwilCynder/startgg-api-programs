import { client } from "./include/lib/client.js";
import { User } from "./include/user.js"; 
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 
import { addInputParams, addOutputParamsCustom, addUsersParams, doWeLog, isSilent } from "./include/lib/paramConfig.js";
import { addEventParsersSwitchable, readEventLists } from "./include/lib/computeEventList.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { output, readInputText, readMultimodalArrayInput } from "./include/lib/util.js";
import { getEventsSetsBasic } from "./include/getEventsSets.js";
import { leagueHeadHeadToHeadFromSetsArray } from "./include/leagueHead2Head.js";
import { yellow } from "./include/lib/consoleUtil.js";

let {eventSlugs, eventsFilenames, userSlugs, filename, total, count, userDataFile, outputFormat, outputfile, logdata, printdata, silent, inputfile, stdinput, display} = new ArgumentsManager()
    .apply(addUsersParams)
    .apply(addEventParsersSwitchable)
    .apply(addOutputParamsCustom(true, true))
    .apply(addInputParams)
    .addSwitch(["-t", "--total"], {description: "Add the sum of all head to heads at the end of each player's line"})
    .addSwitch(["-d", "--display"], {description: "Do not compute data, treat input data as an already computed result of this script and only use the display functionality"})
    .addOption(["-c", "--count"], {description: "Compute a ranking of the most played sets, keeping only the top n. Pass a null or negative n to keep all"})
    .enableHelpParameter()
    .setMissingArgumentBehavior("Missing argument", 1, false)
    .parseProcessArguments();

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let data;
if (display){
    let [fileinput, stdinput_] = await readInputText(inputfile, stdinput);
    data = stdinput_ || fileinput;
    if (!data){
        console.error("No input data");
        process.exit(1);
    }
} else {
    let events = await readEventLists(eventSlugs, eventsFilenames);

    let limiter = new StartGGDelayQueryLimiter;
    let [users, sets] = await Promise.all([
        User.createUsersMultimodal(client, limiter, userSlugs, filename, userDataFile),
        readMultimodalArrayInput(inputfile, stdinput, getEventsSetsBasic(client, events, limiter)),
    ])
    limiter.stop();

    console.log(sets);

    let matrix = leagueHeadHeadToHeadFromSetsArray(sets, users);
    data = {matrix, users};
}

if (count > 0 && (!data.count || !data.count.length != count)){
    let totals = data.matrix.flat().map(h2h => ({users: [h2h[0].user, h2h[1].user], count: h2h[0].score + h2h[1].score}))
    totals.sort((a, b) => (b.count - a.count));
    data.count = totals.slice(0, count);
}

if (silent_) unmuteStdout();

if (logdata_ && count > 0){
    for (let h2h of data.count){
        console.log("-", yellow(data.users[h2h.users[0]].name), "vs", yellow(data.users[h2h.users[1]].name), ":", h2h.count);
    }
}

output(outputFormat, outputfile, printdata, data, (data) => {
    if (count){
        let result = "";
        for (let h2h of data.count){
            result += data.users[h2h.users[0]].name + '\t' + data.users[h2h.users[1]].name + '\t' + h2h.count;
        }
        return result;
    } else { 
        let {matrix, users} = data;

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
    }
})