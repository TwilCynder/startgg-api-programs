import { client } from "./include/lib/client.js";
import * as fs from 'fs'
import { User } from "./include/user.js";
import * as SC from "./include/computeStandingComparison.js";   
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { EventListParser, SwitchableEventListParser } from "./include/lib/computeEventList.js";
import { fResults, readJSONAsync, readLines } from "./include/lib/lib.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { getStandingsFromUsers } from "./include/getStandingsFromUser.js";
import { getEventsResults } from "./include/getEventResults.js";
import { loadInputFromStdin } from "./include/lib/loadInput.js";

let {events, slugsFilename, startDate, endDate, outputFormat, outputfile, logdata, printdata, silent, inputfile, stdinput} = new ArgumentsManager()
    .addParameter("slugsFilename", {}, false)
    .addParameter("startDate", {type: "number"}, true)
    .addParameter("endDate", {type: "number"}, true)
    .addCustomParser(new SwitchableEventListParser, "events")
    .apply(addOutputParams)
    .apply(addInputParams)
    .enableHelpParameter()
    .setMissingArgumentBehavior("Missing argument", 1, false)
    .parseProcessArguments();

let [logData_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

let userSlugs;
try {
    userSlugs = readLines(slugsFilename).filter(line => !!line);
} catch (err){
    console.error("Could not read user slugs from file", slugsFilename, ":", err);
    process.exit(1);
}

let limiter = new StartGGDelayQueryLimiter;

//let users = await User.createUsers(client, userSlugs, limiter);


let [users, results] = await Promise.all([
    User.createUsers(client, userSlugs, limiter),
    Promise.all([
        inputfile ? readJSONAsync(inputfile).catch(err => {
            console.warn(`Could not open file ${inputfile} : ${err}`)
            return [];
        }) : null,
        stdinput ? loadInputFromStdin() : null,

        (async ()=>{
            if (startDate || endDate){
                if (events.length > 0){
                    console.warn("Both a start date/end date and a list of events have been specified. This program can only use one of these methods of fetching events ; the events list will be ignored.");
                }

                return await getStandingsFromUsers(client, userSlugs, limiter, startDate, endDate);
            } else {
                return await getEventsResults(client, events, undefined, limiter);
            }
        })()
    ]).then(results => results.reduce((previous, current) => current ? previous.concat(current) : previous, []))
])

console.log(users, results);
process.exit(0);


let result = "\\\\\\";
for (let user of users){
    result += '\t' + user.name;
}

console.log("Looking for events after", new Date(begin * 1000).toLocaleDateString("fr-FR"), "and before", new Date(end * 1000).toLocaleDateString("fr-FR"));
let matrix = await SC.computeStandingComparison(client, users, begin, end);

for (let i = 0; i < users.length ; i++){
    result+= '\n' + users[i].name
    for (let j = 0; j < users.length; j++){
        if (i == j){
            result += '\tXXXX'
        } else if (i < j){
            let comp = SC.getSCFromIndex(matrix, users, i, j);
            result += '\t' + comp.left + "-" + comp.right + "-" + comp.draws;
        } else if (i > j){  
            let comp = SC.getSCFromIndex(matrix, users, j, i);
            result += '\t' + comp.right + "-" + comp.left + "-" + comp.draws;
        }
    }
}

console.log(result);

fs.mkdir('out', () => {});
fs.writeFileSync('./out/standingComparison.txt', result, (err) => {
    console.error(err);
})