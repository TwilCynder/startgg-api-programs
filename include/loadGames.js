import { getVideogameID } from "./getVideogameID.js";
import { extractSlug, TimedQuerySemaphore } from "startgg-helper";

/**
 * Returns an array of game IDs from a comma-separated list of game ids or game slugs
 * @param {GraphQLClient} client 
 * @param {string?} string 
 * @param {TimedQuerySemaphore} limiter 
 */
export function processGameListString(client, string, limiter){
    return string ? loadGames(client, string.split(","), limiter) : string;
}

/**
 * Loads the numerical IDs for a list of game slugs or IDs.
 * @param {GraphQLClient} client 
 * @param {[number | string]} games 
 * @param {TimedQuerySemaphore} limiter 
 * @returns 
 */
export async function loadGames(client, games, limiter){
    return await Promise.all(games.map(game => {
        if (typeof game == "number"){
            return game;
        } else {
            const id = parseInt(game);
            if (!id){ //assume it was a slug
                if (!game.includes("game/")) game = "game/"+game;
                return getVideogameID(client, extractSlug(game), limiter);
            } else {
                return id;
            }
        }
    }))
}