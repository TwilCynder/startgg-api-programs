import { relurl } from "./lib/dirname.js";
import { readFileSync } from 'fs';
import { Query } from "./lib/query.js"
import { GraphQLClient } from "graphql-request";
import { TimedQuerySemaphore } from "./lib/queryLimiter.js";

const schemaFilename = "./GraphQLSchemas/TournamentImage.txt";

const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});
const query = new Query(schema, 3); 

/**
 * @typedef {{url: string, type: string}} TournamentImage
 */

/**
 * 
 * @param {GraphQLClient} client 
 * @param {{imgType?: string, id?: number, slug?: string}} params 
 * @param {TimedQuerySemaphore} limiter 
 * @returns {Promise<TournamentImage[]>}
 */
async function getTournamentImageExecute(client, params, limiter){
    let res = await query.execute(client, params, limiter);

    if (!res.tournament) throw "Tournament not found.";

    return res.tournament.images;
}

/**
 * Returns the images matching a given type, or all of them if imgType is undefined.  
 * You need to specify EITHER id or slug. Keep the other undefined
 * @param {GraphQLClient} client 
 * @param {string?} imgType 
 * @param {number} id 
 * @param {string} slug 
 * @param {TimedQuerySemaphore} limiter 
 * @returns 
 */
export function getTournamentImage_(client, imgType, id, slug, limiter = null){
    return getTournamentImageExecute(client, {type: imgType ?? undefined, id: id ?? undefined, slug: slug ?? undefined}, limiter);
}

/**
 * Returns the images matching a given type, or all of them if imgType is undefined or null.
 * @param {GraphQLClient} client 
 * @param {string?} imgType 
 * @param {string | number} idOrSlug 
 * @param {TimedQuerySemaphore} limiter 
 * @returns 
 */
export function getTournamentImage(client, imgType, idOrSlug, limiter = null){
    let params;
    switch (typeof idOrSlug){
        case "string":
            params = {type: imgType, slug: idOrSlug};
            break;
        case "number":
            params = {type: imgType, id: idOrSlug};
            break;
        default:
            throw "Invalid type for parameter idOrSlug : expected string or number, got " + typeof idOrSlug;
    }
    
    return getTournamentImageExecute(client, params, limiter);
}

/**
 * Returns the given tournament's logo.
 * @param {GraphQLClient} client 
 * @param {string | number} idOrSlug 
 * @param {TimedQuerySemaphore} limiter 
 * @returns 
 */
export async function getTournamentLogo(client, idOrSlug, limiter = null){
    return (await getTournamentImage(client, "profile", idOrSlug, limiter))[0];
}   

/**
 * Returns the given tournament's banner.
 * @param {GraphQLClient} client 
 * @param {string | number} idOrSlug 
 * @param {TimedQuerySemaphore} limiter 
 * @returns 
 */
export async function getTournamentBanner(client, idOrSlug, limiter = null){
    return (await getTournamentImage(client, "banner", idOrSlug, limiter))[0];
}   