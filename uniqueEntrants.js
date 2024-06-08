import { parseArguments } from "@twilcynder/arguments-parser";
import { EventListParser } from "./include/lib/computeEventList.js";
import { getUniqueUsersOverLeague } from "./include/getEntrants.js";
import { client } from "./include/lib/common.js";
import { StartGGDelayQueryLimiter } from "./include/lib/queryLimiter.js";

let [list] = parseArguments(process.argv.slice(2), new EventListParser);

let limiter = new StartGGDelayQueryLimiter;
let users = await getUniqueUsersOverLeague(client, list, limiter);
limiter.stop();

for (let user of users){
    console.log(user.id, user.player.gamerTag)
}