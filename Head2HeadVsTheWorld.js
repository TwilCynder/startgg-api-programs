import { client } from "./include/lib/client.js";
import { User } from "./include/user.js"; 
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 
import { addInputParams, addOutputParams, addUsersParams, doWeLog } from "./include/lib/paramConfig.js";
import { addEventParsersSwitchable, readEventLists } from "./include/lib/computeEventList.js";
import { deep_get, muteStdout, unmuteStdout } from "./include/lib/jsUtil.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { output, readMultimodalInput } from "./include/lib/util.js";
import { getEventsSetsBasic } from "./include/getEventsSets.js";
import { readLinesAsync } from "./include/lib/readUtil.js";

let {eventSlugs, eventsFilenames, userSlugs, filename, userDataFile, worldUsersFilename, outputFormat, outputfile, logdata, printdata, silent, inputfile, stdinput} = new ArgumentsManager()
    .apply(addUsersParams)
    .apply(addEventParsersSwitchable)
    .apply(addOutputParams)
    .apply(addInputParams)
    .addParameter("worldUsersFilename")
    //.addSwitch(["-t", "--total"]) currently the only option
    .enableHelpParameter()
    .setMissingArgumentBehavior("Missing argument", 1, false)
    .parseProcessArguments();

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let [events] = await Promise.all([
    readEventLists(eventSlugs, eventsFilenames),
])
let limiter = new StartGGDelayQueryLimiter;

let [users, world, sets] = await Promise.all([
    User.createUsersMultimodal(client, limiter, userSlugs, filename, userDataFile),
    readLinesAsync(worldUsersFilename),
    readMultimodalInput(inputfile, stdinput, getEventsSetsBasic(client, events, limiter)),
])

limiter.stop();

//============ PROCESSING ================

users.forEach(user => Object.assign(user, {w: 0, l: 0}))

function get_user_slug(slot){
    return deep_get(slot, "entrant.participants.0.user.slug")
}

function find_user(users, slot){
    let slug = get_user_slug(slot);
    for (let user of users){
        if (slug == user.slug){
            return user;
        }
    }
}

function find_slug(slugs, slot){
    let slug = get_user_slug(slot);
    for (let otherSlug of slugs){
        if (slug == otherSlug){
            return otherSlug;
        }
    }
}

for (let set of sets){
    let index = null;
    let user = null;

    if(user = find_user(users, set.slots[0])) index = 0;
    else if(user = find_user(users, set.slots[1])) index = 1;

    if (user){
        let otherSlug = find_slug(world, set.slots[1 - index]);
        if (otherSlug){
            let standing = set.slots[index].standing;
            let score = standing.stats.score.value;
            if (score < 0) continue;
            if (standing.placement > 1){ //perdu
                user.l++;
            } else {    
                user.w++;
            }
        }        
    }
}


if (silent_) unmuteStdout();

if (logdata_){
    for (let user of users){
        console.log(user.name, `${user.w}-${user.l}`);
    }
}

output(outputFormat, outputfile, printdata, users, (users) => {
    let result = "\\\\\\";
    for (let user of users){
        res += user.name + '\t' + user.w + '\t' + user.l + '\n';
    }
    return result;
})