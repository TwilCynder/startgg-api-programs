import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';
import { GraphQLClient } from 'graphql-request';
import { TimedQuerySemaphore } from 'startgg-helper';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventStandingsBare.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching results from event ${params.slug} ...`,
    error: params => `Request failed for event ${params.slug} ...`
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string} slug 
 * @param {number} numEntrants 
 * @param {TimedQuerySemaphore} limiter 
 * @returns {Promise<{}>}
 */
export async function getEventResultsBare(client, slug, perPage = 192, limiter = null){
    console.log("Getting standings from event : ", slug);

    let res = await query.executePaginated(client, {slug}, "event.standings", limiter, {perPage});

    console.log("Fetched results for event", slug);

    return res;
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string[]} slugs 
 * @param {number} numEntrants 
 * @param {TimedQuerySemaphore} limiter 
 * @returns {Promise<{}[]>}
 */
export function getEventsResultsBare(client, slugs, perPage = 192, limiter = null){
    return Promise.all(slugs.map((slug) => getEventResultsBare(client, slug, numEntrants, limiter)
        .catch((err) => console.warn("Slug", slug, "kaput : ", err))
        .then(data => Object.assign(data, {slug}))
    ));
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {Object[]} events 
 * @param {number} numEntrants 
 * @param {TimedQuerySemaphore} limiter 
 */
export function getEventsResultsBareFromObjects(client, events, numEntrants, limiter){
    return Promise.all(events.map(async event => {
        if (!event.slug) {
            console.error("Event object with no slug :", event);
            return event;
        }
        const data = await getEventResultsBare(client, event.slug, numEntrants, limiter);
        Object.assign(event, {standings: {nodes: data}});
        return event;
    }))
}