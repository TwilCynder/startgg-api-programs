import { client } from "./include/lib/client.js";
import { User } from "./include/user.js"; 
import { ArgumentsManager } from "@twilcynder/arguments-parser"; 
import { addInputParams, addOutputParams, addUsersParams, argumentsManager, doWeLog, doWeLogFromArgs } from "./include/lib/paramConfig.js";
import { addEventParsersSwitchable, readEventSlugsLists } from "./include/lib/computeEventList.js";
import { deep_get} from "startgg-helper-node/util";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js"
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { output, outputFromArgs, readMultimodalArrayInput } from "./include/lib/util.js";
import { getEventsSetsBasic } from "./include/getEventsSets.js";
import { readLinesAsync } from "./include/lib/readUtil.js";

//======== CONFIGURING PARAMETERS ========
let {eventSlugs, eventsFilenames, userSlugs, filename, userDataFile, filterUsers, worldUsersFilename, inputfile, scoreonly, allArgs} = argumentsManager()
    .apply(addUsersParams)
    .apply(addEventParsersSwitchable)
    .apply(addOutputParams)
    .apply(addInputParams)
    .addParameter("worldUsersFilename")
    .addSwitch(["-c", "--score-only"], {dest: "scoreonly", description: "Only display the score"})
    //.addSwitch(["-t", "--total"]) currently the only option
    .enableHelpParameter()
    .setMissingArgumentBehavior("Missing argument", 1, false)
    .parseProcessArguments();

let [logdata, silent] = doWeLogFromArgs(allArgs);
if (silent) muteStdout();

//======== PREPROCESSING INPUT ========
let [events] = await Promise.all([
    readEventSlugsLists(eventSlugs, eventsFilenames),
])

//======== LOADING DATA ========
let limiter = new StartGGDelayQueryLimiter;
let [users, world, sets] = await Promise.all([
    User.createUsersMultimodal(client, limiter, userSlugs, filename, userDataFile, filterUsers),
    readLinesAsync(worldUsersFilename),
    readMultimodalArrayInput(inputfile, getEventsSetsBasic(client, events, limiter)),
])

limiter.stop();

//============ PROCESSING DATA ================

console.log(users, world)

users.forEach(user => Object.assign(user, {w: 0, l: 0}))

function get_user_slug(slot){
    return deep_get(slot, "entrant.participants.0.user.slug")
}

function find_user(users, slot){
    let slug = get_user_slug(slot);
    for (let user of users){
        if (slug && slug.includes(user.slug)){
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

//======== OUTPUT ========
if (silent) unmuteStdout();

if (logdata){
    if (scoreonly){
        for (let user of users){
            console.log(`${user.w}-${user.l}`);
        }
    } else {
        for (let user of users){
            console.log(user.name, `${user.w}-${user.l}`);
        }
    }

}

outputFromArgs(allArgs, users, (users) => {
    let res = "";
    if (scoreonly){
        for (let user of users){
            res += user.w + '\t' + user.l + '\n';
        }
    } else {
        for (let user of users){
            res += user.name + '\t' + user.w + '\t' + user.l + '\n';
        }
    }

    return res;
})