import { ArgumentsManager, parseArguments } from "@twilcynder/arguments-parser";
import { EventListParser } from "./include/lib/computeEventList.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";
import { addInputParams, addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { unmuteStdout, muteStdout, readJSONAsync } from "./include/lib/jsUtil.js";
import { output, readMultimodalInput } from "./include/lib/util.js";
import { getEntrantsBasicForEvents } from "./include/getEntrantsBasic.js";
import { processUniqueEntrantsLeague } from "./include/uniqueEntrantsUtil.js";
import { getEntrantsExtendedForEvents } from "./include/getEntrantsExtended.js";
import { getUserSetsChars } from "./include/getUserSetsChars.js";
import { processMain } from "./include/getMain.js";
import { PlayerUserFilter } from "./include/processCharacterStatsFiltered.js";
import { getSortedAttendanceFromEvents } from "./include/getAttendance.js";
import { getVideogameCharacters } from "./include/getVideogameCharacters.js";

let {list, extended, mains, minimum, game, gamefile, inputfile, stdinput, outputFormat, outputfile, logdata, printdata, silent} = new ArgumentsManager()
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
 
let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);

if (silent_) muteStdout();

let limiter = new StartGGDelayQueryLimiter;
let entrants = await readMultimodalInput(inputfile, stdinput, 
    (extended && !mains) ? getEntrantsExtendedForEvents(client, list) : getEntrantsBasicForEvents(client, list)
);
limiter.stop();

extended ||= mains;

let users = minimum ? 
    getSortedAttendanceFromEvents(entrants, true).filter(entrant => entrant.count >= minimum).map(entrant => entrant.user) :
    processUniqueEntrantsLeague(entrants)

let characters;
if (mains){
    if (!gamefile && !game){
        console.error("Main characters info was requested, but neither a game slug (-g) or a game characters filename (-G) were specified. Exiting.");
        process.exit(1)
    }
    characters = gamefile ? await readJSONAsync(gamefile) : await getVideogameCharacters(client, game, null);
    if (characters){
        characters = characters.reduce((prev, {id, name}) => {prev[id] = name ; return prev}, {});
    } else {
        console.error("Characters couldn't be loaded.");
        process.exit(2);
    }
}



if (mains){
    await Promise.all(users.map(async user => {
        console.warn(user.id);
        let data = await getUserSetsChars(client, user.id, null, {max: 70, includeWholeQuery: true});
        user.genderPronoun = data.data.user.genderPronoun;
        user.location = data.data.user.location;
        user.mains = processMain(data.data.sets, new PlayerUserFilter(user.id), mains);
    }))
}

if (silent_) unmuteStdout();

if (logdata_){
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

output(outputFormat, outputfile, printdata, users, (users) => {
    let resultString = "";
    for (let user of users){
        resultString += 
            user.player.gamerTag + "\t" +
            dash(user.genderPronoun) + "\t" +
            (user.location ? dash(user.location.city) + "\t" + dash(user.location.state) : "\t") + "\t";
        if (mains){
            for (let i = 0; i < mains; i++){
                console.log(user.mains[i]);
                
                resultString += (user.mains[i] ? characters[user.mains[i].id] : "--") + "\t";
            }
        }
        resultString += "\n";
    }
    return resultString;
});