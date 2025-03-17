import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addEventFilterParams, addInputParams, addOutputParams, addUsersParams, doWeLog } from "./include/lib/paramConfig.js";
import { deep_get, muteStdout, readJSONInput, readLines, unmuteStdout } from "./include/lib/jsUtil.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { output, readMultimodalInput, readUsersFile } from "./include/lib/util.js";
import { addEventParsersSwitchable, readEventLists } from "./include/lib/computeEventList.js";
import { getEventsResults } from "./include/getEventResults.js";
import { User } from "./include/user.js";
import { fetchUsersStandings, tryReadUsersFile } from "./include/fetchUserEvents.js";
import { filterEvents } from "./include/filterEvents.js";

//========== CONFIGURING PARAMETERS ==============

let {
    userSlugs, filename, userDataFile, 
    eventSlugs, eventsFilenames, 
    games, minEntrants, filter, exclude_expression, startDate, endDate, minimumIn, offline,
    outputFormat, outputfile, logdata, printdata, silent, eventName, outSlug,
    inputfile, stdinput, 
} = new ArgumentsManager()
    .setAbstract("Computes the results achieved by a given list of users at a set of tournaments. You can use preexisting standings data as fetched by download/downloadStandingsFromUsers.js or by download/downloadEventsStandings.js, or ")
    .apply(addOutputParams)
    .apply(addInputParams)
    .apply(addEventParsersSwitchable)
    .apply(addUsersParams)
    .addSwitch("--eventName", {
        description: "Include each event's name in the csv result (aside from the tournament's name)"
    })
    .addOption(["-M", "--minimum-in"], {
        dest: "minimumIn",
        type: "number",
        description: "Minimum amount of users for an event to be included in the output"
    })
    .apply(addEventFilterParams)
    .addSwitch(["-u", "--output-slug"], {dest: "outSlug", description: "Include event slugs in the csv output"})
    .enableHelpParameter()

    .parseProcessArguments()

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);
if (silent_) muteStdout();
let events = await readEventLists(eventSlugs, eventsFilenames);

//========== LOADING DATA ==============

userSlugs = await tryReadUsersFile(filename, userSlugs);

let limiter = new StartGGDelayQueryLimiter;

let [users, data] = await Promise.all([
    User.createUsersMultimodal(client, userSlugs, limiter, userDataFile),
    readMultimodalInput(inputfile, stdinput, 
        (async()=>{
            if (startDate || endDate){
                return await fetchUsersStandings(client, userSlugs, events, limiter, {startDate, endDate, minEntrants, games});
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

data = data.filter(event => {
    if (!event || !event.standings){
        console.warn("No standings for event", event ? event.slug : null);
        return false;
    }
    return true;
});
data = filterEvents(data, exclude_expression, filter, offline);

for (let event of data){
    if (!event || !event.standings){
        
        continue;
    }
    let standings = event.standings.nodes;
    event.numEntrants = standings.length;
    event.standings.nodes = [];

    for (let standing of standings){
        let user = deep_get(standing, "entrant.participants.0.user");
        if (!user){
            console.log("No user for standing", standing.entrant.participants[0].player.gamerTag, "at", event.tournament.name, standing);
            continue;
        }

        for (let u of users){
            if (user.id == u.id){
                event.standings.nodes.push(standing);
            }
        }
    }
}

if (minimumIn){
    data = data.filter(event => event.standings.nodes.length >= minimumIn);
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
    if (outSlug){
        result += '\t' + event.slug;
    }
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