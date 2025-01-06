import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addInputParams } from "./include/lib/paramConfig.js";
import { readMultimodalInput, readUsersFile } from "./include/lib/util.js";
import { getUsersInfoExtended } from "./include/getUserInfoExtended.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";

let {userSlugs, file, inputfile, stdinput} = new ArgumentsManager()
    .addMultiParameter("userSlugs")
    .addOption(["-f", "--users-file"], {dest: "file", description: "File containing a list of user slugs"})
    .apply(addInputParams)
    
    .parseProcessArguments();

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



function displayUser(user){
    console.log("Name :", user.player.gamerTag);
    if (user.player.prefix) console.log("Tag :", user.player.prefix);
    if (user.genderPronoun) console.log("Pronouns :", user.genderPronoun);
    if (user.location){
        console.log(user.location)
        console.log("Location : ", [user.location.city, user.location.state, user.location.country].filter(e=>e).join(", "));
    }
}

if (users.length == 1){
    displayUser(users[0]);
} else {
    for (let user of users.slice(0, -1)){
        displayUser(user);
        console.log("---------");
    }
    displayUser(users.at(-1));
}