import { GraphQLClient } from 'graphql-request';
import { Query } from './lib/query.js';
import { readSchema } from './lib/util.js';
import { TimedQuerySemaphore } from './lib/queryLimiter.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserSetsChars.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from user ${params.id ? params.id : params.slug} ...`,
    error: params => `Request failed for user ${params.id ? params.id : params.slug} ...`
}

function getIWQMode(iwq){
    return iwq ? Query.IWQModes.OUT : Query.IWQModes.DONT;
}

async function runQueryWithSlug(client, slug, limiter, max, after, includeWholeQuery){
    return {slug, data: await query.executePaginated(client, {slug, after}, "user.player.sets.nodes", limiter, {maxElements: max, perPage: 30, includeWholeQuery: getIWQMode(includeWholeQuery)})};
}

async function runQueryWithID(client, id, limiter, max, after, includeWholeQuery){
    return {id, data: await query.executePaginated(client, {id, after}, "user.player.sets.nodes", limiter, {maxElements: max, perPage: 30, includeWholeQuery: getIWQMode(includeWholeQuery)})};
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
    if (config.includeWholeQuery){
        let [sets, data] = result.data;
        data.sets = sets;
        data.user.player.sets = undefined;
        result.data = data;
    }

    const until = config.until;
    return (result && until) ? result.sets.filter(set => !until || set.completedAt < until) : result;
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
    return Promise.all(slugsOrIDs.map(slugOrID => getUserSetsChars(client, slugOrID, limiter, config).catch((err) => console.error("Slug / ID", slugOrID, "kaput : ", err))));
}
