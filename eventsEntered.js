import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { muteStdout, readLines, unmuteStdout } from "./include/lib/jsUtil.js";
import { getEventsFromUsers } from "./include/getEventsFromUser.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { output } from "./include/lib/util.js";
import { getVideogameID } from "./include/getVideogameID.js";
import { extractSlug } from "./include/lib/tournamentUtil.js";

let {userSlugs, filename, start_date, end_date, exclude_expression, outputFormat, outputfile, logdata, printdata, silent, slugOnly, filter, games, minEntrants} = new ArgumentsManager()
    .apply(addOutputParams)
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
        {description: "Regular expressions that will remove events they match with"}
    )
    .addMultiOption(["-b", "--filter"], {description: "Add a word filter. Events containing one of these words will be ignored"})
    .addOption(["-g", "--games"], {description: "Comma-separated list of videogames to limit search to. Can be start.gg game slugs or numerical IDs"})
    .addOption(["-m", "--min-entrants"], {dest: "minEntrants", type: "number", description: "Only count events with at least this number of entrants"})
    .addSwitch(["-u", "--slug-only"], {dest: "slugOnly", description: "Only output the slug for each event"})
    .enableHelpParameter()

    .parseProcessArguments()

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

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

let gamesID;
if (games){
    gamesID = await Promise.all(games.split(",").map(word => {
        word = word.trim();
        let id = parseInt(word);
        if (!id){ //assuming it was a slug
            return getVideogameID(client, extractSlug(word), limiter);
        } else {
            return id;
        }
    }))
}

let data = await getEventsFromUsers(client, userSlugs, limiter, {
    after: start_date,
    until: end_date,
    games: gamesID,
    minEntrants: minEntrants
})
limiter.stop();

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

if (filter && filter.length){
    data = data.filter(event => {
        for (let word of filter){
            if (event.slug.includes(word)) return false
        }
        return true;
    })
}


if (silent_) unmuteStdout();

if (logdata_){
    if (slugOnly){
        for (let event of data){
            console.log(event.slug);
        }
    } else {
        for (let event of data){
            console.log(event.tournament.name, '-', event.name, `(${event.slug}) |`, event.numEntrants, "entrants |", "on", new Date(event.startAt * 1000).toLocaleDateString("fr-FR"));
        }
    }

}

output(outputFormat, outputfile, printdata, data, (data) => {
    let resultString = "";
    if (slugOnly ){
        for (let event of data){
            resultString += event.slug + '\n';
        }
    } else {
        for (let event of data){
            resultString += event.slug + '\t' + event.tournament.name + '\t' + event.name + '\t' + event.numEntrants + '\t' + event.startAt + '\n';
        }
    }

    return resultString;
});