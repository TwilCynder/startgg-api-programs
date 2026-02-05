import { GraphQLClient } from 'graphql-request';
import { Query, TimedQuerySemaphore } from 'startgg-helper';

async function runQueryWithSlug(query, client, slug, limiter, max, after){
    return query.executePaginated(client, {slug, after}, "user.player.sets", limiter, {maxElements: max, perPage: 30});
}

async function runQueryWithID(query, client, id, limiter, max, after){
    return query.executePaginated(client, {id, after}, "user.player.sets", limiter, {maxElements: max, perPage: 30});
}

function getRunF(slugOrID){
    return slugOrID > 0 ? runQueryWithID : runQueryWithSlug;
}

/**
 * @param {GraphQLClient} client 
 * @param {typeof runQueryWithSlug} runF 
 * @param {string | number} slugOrID 
 * @param {TimedQuerySemaphore} limiter 
 * @param {{max?: number, after?: number, until?:number}} config 
 * @returns 
 */
async function getUserSetsGeneric_(query, client, runF = runQueryWithSlug, slugOrID, limiter, config = {}){
    let sets = await runF(query, client, slugOrID, limiter, config.max, config.after);

    const until = config.until;
    return (sets && until) ? sets.filter(set => !until || set.completedAt < until) : sets;
}

/**
 * @param {GraphQLClient} client 
 * @param {string | number} slugOrID 
 * @param {TimedQuerySemaphore} limiter 
 * @param {{max?: number, after?: number, until?:number}} config 
 * @returns 
 */
export function getUserSetsGeneric(query, client, slugOrID, limiter, config){
    return getUserSetsGeneric_(query, client, getRunF(slugOrID), slugOrID, limiter, config);
}

/**
 * @param {GraphQLClient} client 
 * @param {(string|number)[]} slugsOrIDs 
 * @param {TimedQuerySemaphore} limiter 
 * @param {{max?: number, after?: number, until?:number,}} config 
 * @returns 
 */
export function getUsersSetsGeneric(query, client, slugsOrIDs, limiter, config){
    return Promise.all(slugsOrIDs.map(slugOrID => getUserSetsGeneric(query, client, slugOrID, limiter, config).catch((err) => console.error("Slug / ID", slugOrID, "kaput : ", err))));
}

/**
 * 
 * @param {Query} query 
 * @param {GraphQLClient} client 
 * @param {{}[]} users 
 * @param {TimedQuerySemaphore} limiter 
 * @param {{max?: number, after?: number, until?:number,}} config 
 */
export function getUserSetsGenericFromObjects(query, client, users, limiter, config){
    return Promise.all(users.map(async user => {
        if (!user.id && !user.slug()){
            console.error("User object with no slug or id :", user);
            return user;
        }
        const sets = await getUserSetsGeneric(query, client, user.id ?? user.slug, limiter, config);
        user = Object.assign(user, {sets});
        return user;
    }))
}