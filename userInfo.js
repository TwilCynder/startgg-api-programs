import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addInputParams, addOutputParamsCustom, doWeLog } from "./include/lib/paramConfig.js";
import { outputTextLazy, readMultimodalInput, readUsersFile } from "./include/lib/util.js";
import { getUsersInfoExtended } from "./include/getUserInfoExtended.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";

let {userSlugs, file, inputfile, stdinput, outputfile, printdata, silent, logdata, slug} = new ArgumentsManager()
    .addMultiParameter("userSlugs")
    .addOption(["-f", "--users-file"], {dest: "file", description: "File containing a list of user slugs"})
    .addSwitch(["-u", "--slug"], {description: "Include slug in output"})
    .apply(addOutputParamsCustom(true, false))
    .apply(addInputParams)
    .enableHelpParameter()
    
    .parseProcessArguments();

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);
if (silent_) muteStdout();

userSlugs = await readUsersFile(file, userSlugs);

let users = await readMultimodalInput(inputfile, stdinput, (async()=>{
    if (userSlugs){
        let limiter = new StartGGDelayQueryLimiter;
        let data = await getUsersInfoExtended(client, userSlugs, limiter);
        limiter.stop();
        return data;
    }
    return [];
})());

function locationString(location){
    return location ? [location.city, location.state, location.country].filter(e=>e).join(", ") : ""
}

function displayUser(user){
    console.log("Name :", user.player.gamerTag);
    if (user.player.prefix) console.log("Tag :", user.player.prefix);
    if (user.genderPronoun) console.log("Pronouns :", user.genderPronoun);
    if (user.location){
        console.log(user.location)
        console.log("Location : ", locationString(user.location));
    }
}

if (silent_) unmuteStdout();

if (logdata_){
    if (users.length == 1){
        displayUser(users[0]);
    } else {
        for (let user of users.slice(0, -1)){
            displayUser(user);
            console.log("---------");
        }
        displayUser(users.at(-1));
    }
}

outputTextLazy((users) => {
    let res = "";
    for (let user of users) {
        if (slug) res += user.slug + '\t';
        res += (user.player.prefix ?? "") + '\t';
        res += user.player.gamerTag + '\t';
        res += (user.genderPronoun ?? "") + '\t';
        res += locationString(user.location) + '\t';
        res += '\n'
    }
    return res;
}, outputfile, printdata, users)