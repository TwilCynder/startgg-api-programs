import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { deep_get, muteStdout, readJSONAsync, readLines, unmuteStdout } from "./include/lib/jsUtil.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { output, readMultimodalInput } from "./include/lib/util.js";
import { addEventParsers, readEventLists, SwitchableEventListParser } from "./include/lib/computeEventList.js";
import { getStandingsFromUsers } from "./include/getStandingsFromUser.js";
import { getEventsResults } from "./include/getEventResults.js";
import { User } from "./include/user.js";
import { loadInputFromStdin } from "./include/lib/loadInputStdin.js";

//========== CONFIGURING PARAMETERS ==============

let {userSlugs, filename, start_date, end_date, eventSlugs, eventsFilenames, exclude_expression, minimum_in, outputFormat, outputfile, logdata, printdata, silent, inputfile, stdinput, eventName} = new ArgumentsManager()
    .setAbstract("Computes the results achieved by a given list of users at a set of tournaments.")
    .apply(addOutputParams)
    .apply(addInputParams)
    .apply(addEventParsers)
    .addMultiParameter("userSlugs", {
        description: "A list of users slugs to fetch events for"
    })
    .addOption(["-f", "--filename"], {
        description: "Path to a file containing a list of user slugs"
    })
    .addOption("--start_date", {
        type: "number",
        description: "Only count tournaments after this UNIX date"
    })
    .addOption("--end_date", {
        type: "number",
        description: "Only count tournaments before this UNIX date"
    })
    .addMultiOption(["-R", "--exclude_expression"], 
        {description: "A list of regular expressions that will remove events they match with"}
    )
    .addOption(["-m", "--minimum_in"], {
        type: "number",
        description: "Minimum amount of users for an event to be included in the output"
    })
    .addSwitch("--eventName", {
        description: "Include each event's name in the result (aside from the tournament's name)"
    })
    .enableHelpParameter()

    .parseProcessArguments()

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let events = await readEventLists(eventSlugs, eventsFilenames);

//========== LOADING DATA ==============

if (filename){
    try {
        let fileSlugs = readLines(filename).filter(line => !!line);
        if (fileSlugs){
            userSlugs = userSlugs.concat(fileSlugs);
        }
    } catch (err){
        console.error("Could not read user slugs from file", filename, ":", err);
        process.exit(1);
    }
}

let limiter = new StartGGDelayQueryLimiter;

let [users, data] = await Promise.all([
    User.createUsers(client, userSlugs, limiter),
    readMultimodalInput(inputfile, stdinput, 
        (async()=>{
        
            if (start_date || end_date){
                if (events){
                    console.log("The arguments specify both a time range and an event list. The event list will be treated as a blacklist.")
                }
                return await getStandingsFromUsers(client, userSlugs, limiter, start_date, end_date, events);
            } else {
                return await getEventsResults(client, events, undefined, limiter);
            }
        })()
    )
])

limiter.stop();

//========== PROCESSING DATA ==============

if (!users || users.length < 1){
    console.warn("No users specified : result will be empty");
}

if (exclude_expression){
    let exclude_regex = exclude_expression.map(exp => new RegExp(exp));
    data = data.filter( event => {
        for (let exp of exclude_regex){
            if (exp.test(event.slug)){
                return false;
            }
        }
        return true;
    })
}

for (let event of data){
    let standings = event.standings.nodes;
    event.numEntrants = standings.length;
    event.standings.nodes = [];

    for (let standing of standings){
        let user = deep_get(standing, "entrant.participants.0.user");
        if (!user){
            console.log("No user for standing", standing.entrant.participants[0].player.gamerTag, standing);
            continue;
        }

        for (let u of users){
            if (user.id == u.id){
                event.standings.nodes.push(standing);
            }
        }
    }
}

if (minimum_in){
    data = data.filter(event => event.standings.nodes.length >= minimum_in);
}

data = data.sort((a, b) => a.startAt - b.startAt);

if (silent_) unmuteStdout();

//========== OUTPUT ==============

function generateLine(event){
    let date = new Date(event.startAt * 1000)
    let dateString = "d/m/Y"
        .replace('Y', date.getFullYear())
        .replace('m', date.getMonth()+1)
        .replace('d', date.getDate());
    let result = `${dateString}\t${event.tournament.name}\t${eventName ? event.name + "\t" : ""}${event.numEntrants}`;

    for (const s of event.standings.nodes){
        let name = s.entrant.participants[0].player.gamerTag;
        result += '\t' + `${s.placement} : ${name}`;
    }

    return result;
}

printdata = printdata || logdata_;

output(outputFormat, outputfile, printdata, data, (data) => {
    let resultString = "";
    for (let event of data){
        //console.log(event.tournament.name, `(${event.slug}) on`, new Date(event.startAt * 1000).toLocaleDateString("fr-FR"));
        resultString += generateLine(event) + '\n';
    }

    return resultString;
});