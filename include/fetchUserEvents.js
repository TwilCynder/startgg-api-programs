import { GraphQLClient } from "graphql-request";
import { readUsersFile } from "./lib/util.js";
import { TimedQuerySemaphore } from "./lib/queryLimiter.js";
import { getStandingsFromUsers } from "./getStandingsFromUser.js";
import { loadGames } from "./loadGames.js";
import { toUNIXTimestamp } from "./lib/jsUtil.js";
import { getEventsFromUsers } from "./getEventsFromUser.js";

/**
 * 
 * @param {import("./getEventsFromUser.js").GEFUConfig} config 
 */
function finalizeConfig(config){
    if (config.games && config.games.length && (typeof config.games[0] != "number")){
        config.games = loadGames(client, config.games, limiter);
    }
    config.startDate = toUNIXTimestamp(config.startDate);
    config.endDate = toUNIXTimestamp(config.endDate);
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string[]} userSlugs 
 * @param {string[]} events 
 * @param {TimedQuerySemaphore} limiter 
 * @param {import("./getStandingsFromUser.js").GEFUConfig} config 
 * @returns 
 */
export async function fetchUsersStandings(client, userSlugs, events, limiter, config){
    if (events){
        console.log("The arguments specify both a time range and an event list. The event list will be treated as a blacklist.")
    }
    finalizeConfig(config);
    return await getStandingsFromUsers(client, userSlugs, limiter, config, events);
}

export async function fetchUserEvents(client, userSlugs, limiter, config){
    finalizeConfig(config);
    return await getEventsFromUsers(client, userSlugs, limiter, config);
}

export async function tryReadUsersFile(filename, userSlugs){
    if (filename){
        try {
            userSlugs = await readUsersFile(filename, userSlugs);
        } catch (err){
            console.error("Could not read user slugs from file", filename, ":", err);
            process.exit(1);
        }
    }
}