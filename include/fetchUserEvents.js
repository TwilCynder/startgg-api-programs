import { GraphQLClient } from "graphql-request";
import { readUsersFile } from "./lib/util.js";
import { TimedQuerySemaphore } from "startgg-helper";
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