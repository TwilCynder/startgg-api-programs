import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { deep_get, muteStdout, readLines, unmuteStdout } from "./include/lib/lib.js";
import { client } from "./include/lib/client.js";
import { StartGGClockQueryLimiter, StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { output } from "./include/lib/util.js";
import { SwitchableEventListParser } from "./include/lib/computeEventList.js";
import { getStandingsFromUsers } from "./include/getStandingsFromUser.js";
import { getEventsResults } from "./include/getEventResults.js";
import { User } from "./include/user.js";

//========== CONFIGURING PARAMETERS ==============

let {userSlugs, filename, start_date, end_date, events, exclude_expression, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
    .setAbstract("Computes the results achieved by a given list of users at a set of tournaments.")
    .apply(addOutputParams)
    .addCustomParser(new SwitchableEventListParser, "events")
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
    .addMultiOption(["-E", "--exclude_expression"], 
        {description: "A list of regular expressions that will remove events they match with"}
    )
    .enableHelpParameter()

    .parseProcessArguments()

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

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

console.log(end_date, start_date);

let limiter = new StartGGClockQueryLimiter;

let [users, data] = await Promise.all([
    User.createUsers(client, userSlugs, limiter),
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
])

limiter.stop();

//========== PROCESSING DATA ==============

if (exclude_expression){
    console.log(exclude_expression)
    let exclude_regex = exclude_expression.map(exp => new RegExp(exp));
    console.log(exclude_regex);
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
    event.nodes.standings = [];

    console.log(event)

    for (let standing of standings){
        let user = deep_get(standing, "entrant.participants.0.user");
        if (!user){
            console.log("No user for standing", standing);
            continue;
        }

        for (let u of users){
            if (user.id == u.id){
                event.standings.push(standing);
            }
        }
    }
}

if (silent_) unmuteStdout();

//========== OUTPUT ==============

function generateLine(event){
    let date = new Date(event.startAt * 1000)
    let dateString = "d/m/Y"
        .replace('Y', date.getFullYear())
        .replace('m', date.getMonth()+1)
        .replace('d', date.getDate());
    let result = `${dateString}\t${event.tournament.name}`;

    for (const s of event.standings.nodes){
        let name = s.entrant.player.gamerTag;
        result += '\t' + `${standing.placement} : ${name}`;
    }

    return result;
}

if (logdata_){
    for (let event of data){
        console.log(event.tournament.name, `(${event.slug}) on`, new Date(event.startAt * 1000).toLocaleDateString("fr-FR"));
        console.log(generateLine(event));
    }
}

output(outputFormat, outputfile, printdata, data, (data) => {
    let resultString = "";
    for (let event of data){
        resultString += event.slug + '\t' + event.tournament.name + '\t' + event.numEntrants + '\t' + event.startAt + '\n';
    }
    return resultString;
});