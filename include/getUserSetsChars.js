import { GraphQLClient } from 'graphql-request';
import { Query } from './lib/query.js';
import { readSchema } from './lib/util.js';
import { TimedQuerySemaphore } from './lib/queryLimiter.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserSetsChars.txt");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from user ${params.slug} ...`,
    error: params => `Request failed for user ${params.slug} ...`
}

async function runQueryWithSlug(client, slug, limiter, max, after, includeWholeQuery){
    return {slug, sets: await query.executePaginated(client, {slug, after}, "user.player.sets.nodes", limiter, {maxElements: max, perPage: 35, includeWholeQuery})};
}

async function runQueryWithID(client, id, limiter, max, after, includeWholeQuery){
    return {id, sets: await query.executePaginated(client, {id, after}, "user.player.sets.nodes", limiter, {maxElements: max, perPage: 35, includeWholeQuery})};
}

function getRunF(slugOrID){
    return slugOrID > 0 ? runQueryWithID : runQueryWithSlug;
}

/**
 * @param {GraphQLClient} client 
 * @param {typeof runQueryWithSlug} runF 
 * @param {string | number} slugOrID 
 * @param {TimedQuerySemaphore} limiter 
 * @param {{max?: number, after?: number, until?:number, includeWholeQuery?: boolean}} config 
 * @returns 
 */
async function getUserSetsChars_(client, runF = runQueryWithSlug, slugOrID, limiter, config = {}){
    let result = await runF(client, slugOrID, limiter, config.max, config.after, config.includeWholeQuery);
    
    const until = config.until;
    return result && until ? result.sets.filter(set => !until || set.completedAt < until) : result;
}

/**
 * @param {GraphQLClient} client 
 * @param {string | number} slugOrID 
 * @param {TimedQuerySemaphore} limiter 
 * @param {{max?: number, after?: number, until?:number, includeWholeQuery?: boolean}} config 
 * @returns 
 */
export function getUserSetsChars(client, slugOrID, limiter, config){
    return getUserSetsChars_(client, getRunF(slugOrID), slugOrID, limiter, config);
}

/**
 * @param {GraphQLClient} client 
 * @param {(string|number)[]} slugsOrIDs 
 * @param {TimedQuerySemaphore} limiter 
 * @param {{max?: number, after?: number, until?:number, includeWholeQuery?: boolean}} config 
 * @returns 
 */
export function getUsersSetsChars(client, slugsOrIDs, limiter, config){
    return Promise.all(slugsOrIDs.map(slugOrID => getUserSetsChars(client, slugOrID, limiter, config).catch((err) => console.log("Slug", slug, "kaput : ", err))));
}
