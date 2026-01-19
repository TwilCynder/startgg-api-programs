import { GraphQLClient } from "graphql-request";
import { readUsersFile } from "./lib/util.js";
import { TimedQuerySemaphore } from "startgg-helper";
import { getStandingsFromUsers } from "./getStandingsFromUser.js";
import { loadGames, processGameListString } from "./loadGames.js";
import { toUNIXTimestamp } from "startgg-helper-node/util";
import { getEventsFromUsers } from "./getEventsFromUser.js";

/**
 * 
 * @param {import("./getEventsFromUser.js").GEFUConfig} config 
 */
async function finalizeConfig(config, client, limiter){
    config.games = await processGameListString(client, config.games, limiter);
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
    await finalizeConfig(config, client, limiter);
    return await getStandingsFromUsers(client, userSlugs, limiter, config, events);
}

export async function fetchUserEvents(client, userSlugs, limiter, config){
    await finalizeConfig(config, client, limiter);
    return await getEventsFromUsers(client, userSlugs, limiter, config);
}

/**
 * 
 * @param {string} filename 
 * @param {string[]} userSlugs 
 * @returns 
 */
export async function tryReadUsersFile(filename, userSlugs){
    try {
        return await readUsersFile(filename, userSlugs);
    } catch (err){
        console.error("Could not read user slugs from file", filename, ":", err);
        process.exit(1);
    }
}