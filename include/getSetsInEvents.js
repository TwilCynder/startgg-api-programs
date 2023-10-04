import { Query } from './lib/query.js';
import { ClockQueryLimiter, StartGGClockQueryLimiter, StartGGDelayQueryLimiter } from './lib/queryLimiter.js';

/**
 * Fetches all sets in the given event with the given query, which must have a "event(slug) { sets { nodes { ANYTHING } } }" schema.  
 * Applies the given query to the event with the given slug, paginated with path "event.sets.nodes", effectively fetching all the sets.
 * @param {GraphQLClient} client 
 * @param {Query} query 
 * @param {string} slug 
 * @param {ClockQueryLimiter} limiter 
 * @returns {Promise<object[]>}
 */
export async function getSetsInEvent(client, query, slug, limiter){
    let sets = await query.executePaginated(client, {slug, perPage: 50}, "event.sets.nodes", limiter);
    return sets; 
}

export async function getSetsInEvents(client, query, slugs, limiter, noLimit = false) {
    limiter = limiter || (noLimit ? null : new StartGGClockQueryLimiter);

    return Promise.all(slugs.map( (slug) => getSetsInEvent(client, query, slug, limiter).catch((err) => console.log("Slug", slug, "kaput : ", err))))
        .then( (arr) => arr.reduce( (accumulator, currentArray) => (currentArray ? accumulator.concat(currentArray) : accumulator) , []));
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {Query} query 
 * @param {Array<string>} slugs 
 * @param {(accumulator: T, currentValue: any) => T} callback 
 * @param {T} initValue 
 * @param {ClockQueryLimiter} limiter 
 * @returns {T}
 */
export async function reduceSetsInEvents(client, query, slugs, callback, initValue, limiter, noLimit = false){
    limiter = limiter || (noLimit ? null : new StartGGDelayQueryLimiter);

    return Promise.all( slugs.map( ( slug ) => 
        getSetsInEvent(client, query, slug, limiter)
            .catch((err) => console.log("Slug", slug, "kaput : ", err))
    )).then( (arr) => arr.reduce(callback, initValue));
}

