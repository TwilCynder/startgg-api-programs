import { GraphQLClient } from "graphql-request";
import { readUsersFile } from "./lib/util.js";
import { TimedQuerySemaphore } from "./lib/queryLimiter.js";
import { getStandingsFromUsers } from "./getStandingsFromUser.js";

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string[]} userSlugs 
 * @param {string[]} events 
 * @param {TimedQuerySemaphore} limiter 
 * @param {import("./getStandingsFromUser.js").GEFUConfig} config 
 * @returns 
 */
export function fetchUsersStandings(client, userSlugs, events, limiter, config){
    if (events){
        console.log("The arguments specify both a time range and an event list. The event list will be treated as a blacklist.")
    }
    return getStandingsFromUsers(client, userSlugs, limiter, config, events);
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