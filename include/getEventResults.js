import { PageResult, Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';
import { GraphQLClient } from 'graphql-request';
import { TimedQuerySemaphore } from 'startgg-helper';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventStanding.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching results from event ${params.slug} ...`,
    error: params => `Request failed for event ${params.slug} ...`
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string} slug 
 * @param {number} numEntrants Deprecated
 * @param {TimedQuerySemaphore} limiter 
 * @returns {Promise<{}>}
 */
export async function getEventResults(client, slug, numEntrants, limiter = null){
    console.log("Getting standings from event : ", slug);

    let res = await query.executePaginated(client, {slug}, "event.standings", limiter, {perPage: 120, includeWholeQuery: Query.IWQModes.INLINE, callback: (localResult, previousResult) => {
        if (!numEntrants) return;
        if (localResult && previousResult && (localResult.length + previousResult.length > numEntrants)) 
            return new PageResult(localResult.slice(0, numEntrants - previousResult.length), true);
    }});
    if (!res.event) {
        console.warn("Couldn't fetch resuls for event", slug);
        return {slug};
    }

    console.log("Fetched results for event", slug);

    return res.event;
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string[]} slugs 
 * @param {number} numEntrants 
 * @param {TimedQuerySemaphore} limiter 
 * @returns {Promise<{}[]>}
 */
export function getEventsResults(client, slugs, numEntrants, limiter = null){
    return Promise.all(slugs.map((slug) => getEventResults(client, slug, numEntrants, limiter)
        .catch((err) => console.warn("Slug", slug, "kaput : ", err))
        .then(data => data ? Object.assign(data, {slug}) : null)
    ));
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {Object[]} events 
 * @param {number} numEntrants 
 * @param {TimedQuerySemaphore} limiter 
 */
export function getEventsResultsFromObjects(client, events, numEntrants, limiter){
    return Promise.all(events.map(async event => {
        if (!event.slug) {
            console.error("Event object with no slug :", event);
            return event;
        }
        const data = await getEventResults(client, event.slug, numEntrants, limiter);
        Object.assign(data, event);
        return data;
    }))
}