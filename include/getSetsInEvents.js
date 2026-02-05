import { Query, TimedQuerySemaphore } from 'startgg-helper';
import { ClockQueryLimiter } from 'startgg-helper';
import { executePaginatedWithSaveManager, getPaginatedProgressManagerFrom, QueriesProgressManager } from './progressSaver.js';

/**
 * Fetches all sets in the given event with the given query, which must have a "event(slug) { sets { nodes { ANYTHING } } }" schema.  
 * Applies the given query to the event with the given slug, paginated with path "event.sets.nodes", effectively fetching all the sets.
 * @param {GraphQLClient} client 
 * @param {Query} query 
 * @param {string} slug 
 * @param {ClockQueryLimiter} limiter 
 * @param {QueriesProgressManager | string?} progressManager 
 * @returns {Promise<object[]>}
 */
export async function getSetsInEvent(client, query, slug, limiter, progressManager){
    progressManager = getPaginatedProgressManagerFrom(progressManager);
    let sets = await executePaginatedWithSaveManager(query, progressManager, client, {slug}, "evebt.sets", limiter, {perPage: 200})
    //let sets = await query.executePaginated(client, {slug}, "event.sets", limiter, {perPage: 50});
    if (!sets) {
        console.warn("Coulnd't fetch sets for event slug", slug);
        return null;
    }
    console.log("Fetched sets for event slug", slug);
    return sets; 
}

export async function getSetsInEvents(client, query, slugs, limiter, progressManager) {
    return Promise.all(slugs.map( (slug) => getSetsInEvent(client, query, slug, limiter, progressManager).catch((err) => console.log("Slug", slug, "kaput : ", err))))
        .then( (arr) => arr.reduce( (accumulator, currentArray, i) => (currentArray ? accumulator.concat(currentArray) : (console.warn(`Slug ${slugs[i]} returned nothing`), accumulator)) , []));
}

export function getSetsInEventsSeparated(client, query, slugs, limiter){
    return Promise.all(slugs.map(slug => getSetsInEvent(client, query, slug, limiter)));
}

export async function getSetsInEventsHashmap(client, query, slugs, limiter, progressManager){

    let events = {}
    await Promise.all( slugs.map( async slug => {
        try {   
            let sets = await getSetsInEvent(client, query, slug, limiter, progressManager);
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
export async function reduceSetsInEvents(client, query, slugs, callback, initValue, limiter, progressManager){
    return Promise.all( slugs.map( ( slug ) => 
        getSetsInEvent(client, query, slug, limiter, progressManager)
            .catch((err) => console.log("Slug", slug, "kaput : ", err))
    )).then( (arr) => arr.reduce(callback, initValue));
}

/**
 * @param {GraphQLClient} client 
 * @param {Query} query 
 * @param {Object[]} events 
 * @param {TimedQuerySemaphore} limiter 
 * @param {QueriesProgressManager | string?} progressManager 
 * @returns 
 */
export async function getSetsInEventsFromObjects(client, query, events, limiter, progressManager){
    return Promise.all(events.map(async event => {
        if (!event.slug) {
            console.error("Event object with no slug :", event);
            return event;
        }
        const data = await getSetsInEvent(client, query, event.slug, limiter, progressManager);
        event.sets = data;
        return events;
    }))
}