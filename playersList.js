import { EventListParser } from "./include/lib/computeEventList.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { addInputParams, addOutputParams, argumentsManager, doWeLogFromArgs } from "./include/lib/paramConfig.js";
import { unmuteStdout, muteStdout } from "./include/lib/fileUtil.js";
import { outputFromArgs, readMultimodalArrayInput } from "./include/lib/util.js";
import { getEntrantsBasicForEvents } from "./include/getEntrantsBasic.js";
import { processUniqueEntrantsLeague } from "./include/uniqueEntrantsUtil.js";
import { getEntrantsExtendedForEvents } from "./include/getEntrantsExtended.js";
import { getUserSetsChars } from "./include/getUserSetsChars.js";
import { processMain } from "./include/getMain.js";
import { PlayerUserFilter } from "./include/processCharacterStatsFiltered.js";
import { getSortedAttendanceFromEvents } from "./include/getAttendance.js";
import { loadCharactersInfo } from "./include/loadVideogameContent.js";

//======== CONFIGURING PARAMETERS ========
let {list, extended, mains, minimum, game, gamefile, inputfile, allArgs} = argumentsManager()
    .addCustomParser(new EventListParser, "list")
    .apply(addInputParams)
    .apply(addOutputParams)
    .addOption(["-m", "--minimum"], {description: "Filter users who attended less than this many events", type: "number"})
    .addSwitch(["-e", "--extended"], {description: "Fetch pronouns and location info for each user"})
    .addOption(["-M", "--mains"], {description: "Fetch main characters info for each user (how many characters)", type: "number"})
    .addOption(["-g", "--game"], {description: "Videogame slug"})
    .addOption(["-G", "--game-file"], {description: "Path for a file containing character names", dest: "gamefile"})
    .enableHelpParameter()
    .parseProcessArguments();
 
extended ||= mains;

let [logdata, silent] = doWeLogFromArgs(allArgs);
if (silent) muteStdout();

//======== LOADING DATA ========
let limiter = new StartGGDelayQueryLimiter;
let entrants = await readMultimodalArrayInput(inputfile, 
    (extended && !mains) ? getEntrantsExtendedForEvents(client, list, limiter) : getEntrantsBasicForEvents(client, list, limiter)
);

//======== PROCESSING DATA ========
entrants = entrants.filter(event => {
    if (!event.entrants){
        console.warn("No event found for slug", event.slug);
        return false;
    }
    return true;
})

let users = minimum ? 
    getSortedAttendanceFromEvents(entrants, true).filter(entrant => entrant.count >= minimum).map(entrant => entrant.user) :
    processUniqueEntrantsLeague(entrants)

let characters;
if (mains){
    characters = loadCharactersInfo(gamefile, client, limiter, game, true);

    await Promise.all(users.map(async user => {
        let data = await getUserSetsChars(client, user.id, limiter, {max: 60, includeWholeQuery: true});
        user.genderPronoun = data.data.user.genderPronoun;
        user.location = data.data.user.location;
        user.mains = processMain(data.data.sets, new PlayerUserFilter(user.id), mains, characters);
    }))
}

//======== OUTPUT ========
limiter.stop();

if (silent) unmuteStdout();

if (logdata){
    for (let user of users){
        let data = [user.player.gamerTag, "|"];
        if (extended){
            if (user.genderPronoun) data.push("Pronouns :", user.genderPronoun, "|");
            if (user.location && (user.location.city || user.location.state)){
                data.push("Location :")
                if (user.location.city) data.push(user.location.city);
                if (user.location.state) data.push(user.location.state);
                data.push("|")
            }
        }
        console.log(...data.slice(0, -1));
    }
}

const dash = value => value ? value : "--"

outputFromArgs(allArgs, users, (users) => {
    let resultString = "";
    for (let user of users){
        resultString += 
            user.player.gamerTag + "\t" +
            dash(user.genderPronoun) + "\t" +
            (user.location ? dash(user.location.city) + "\t" + dash(user.location.state) : "\t") + "\t";
        if (mains){
            for (let i = 0; i < mains; i++){
                //console.log(user.mains[i]);
                
                resultString += (user.mains[i] ? characters[user.mains[i].id] : "--") + "\t";
            }
        }
        resultString += "\n";
    }
    return resultString;
});