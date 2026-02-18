import { TimedQuerySemaphore, toUNIXTimestamp } from "startgg-helper-node";
import { processGameListString } from "./loadGames.js";


/** 
 * @typedef {{startDate: number | Date | string, endDate: number | Date | string, games: string, minEntrants: number}} RawUserEventsConfig
 * @typedef {{startDate: number, endDate: number, games: number[], minEntrants: number}} FinalizedUserEventsConfig 
 * */

/**
 * @param {RawUserEventsConfig} config 
 * @param {GraphQLClient} client 
 * @param {TimedQuerySemaphore} limiter 
 * @returns {Promise<FinalizedUserEventsConfig>}
 */
export async function finalizeUserEventsConfig(config, client, limiter){
    config.games = await processGameListString(client, config.games, limiter);
    config.startDate = toUNIXTimestamp(config.startDate);
    config.endDate = toUNIXTimestamp(config.endDate);
    return config;
}