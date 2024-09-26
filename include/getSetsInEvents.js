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
    let sets = await query.executePaginated(client, {slug}, "event.sets.nodes", limiter, {perPage: 50});
    return sets; 
}

export async function getSetsInEvents(client, query, slugs, limiter, noLimit = false) {
    limiter = limiter || (noLimit ? null : new StartGGClockQueryLimiter);

    return Promise.all(slugs.map( (slug) => getSetsInEvent(client, query, slug, limiter).catch((err) => console.log("Slug", slug, "kaput : ", err))))
        .then( (arr) => arr.reduce( (accumulator, currentArray) => (currentArray ? accumulator.concat(currentArray) : accumulator) , []));
}

export async function getSetsInEventsHashmap(client, query, slugs, limiter, noLimit = false){
    limiter = limiter || (noLimit ? null : new StartGGClockQueryLimiter);

    let events = {}
    await Promise.all( slugs.map( async slug => {
        try {   
            let sets = await getSetsInEvent(client, query, slug, limiter);
            events[slug] = sets;
        } catch (err) {
            console.warn("Slug", slug, "kaput : ", err);
        }
    }));
    return events;
}

/**
 * @template T
 * @param {GraphQLClient} client 
 * @param {Query} query 
 * @param {Array<string>} slugs 
 * @param {(accumulator: T, currentValue: any) => T} callback 
 * @param {T} initValue 
 * @param {ClockQueryLimiter} limiter 
 * @returns {Promise<T>}
 */
export async function reduceSetsInEvents(client, query, slugs, callback, initValue, limiter, noLimit = false){
    limiter = limiter || (noLimit ? null : new StartGGDelayQueryLimiter);

    return Promise.all( slugs.map( ( slug ) => 
        getSetsInEvent(client, query, slug, limiter)
            .catch((err) => console.log("Slug", slug, "kaput : ", err))
    )).then( (arr) => arr.reduce(callback, initValue));
}

