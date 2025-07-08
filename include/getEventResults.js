import { Query } from './lib/query.js';
import { readSchema } from './lib/util.js';
import { GraphQLClient } from 'graphql-request';
import { TimedQuerySemaphore } from './lib/queryLimiter.js';

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
 * @param {number} numEntrants 
 * @param {TimedQuerySemaphore} limiter 
 * @returns {Promise<{}>}
 */
export async function getEventResults(client, slug, numEntrants = 192, limiter = null){
    console.log("Getting standings from event : ", slug);

    let res = await query.execute(client, {slug, numEntrants}, limiter);
    if (!res.event) {
        console.warn("Couldn't fetch resuls for event", slug);
        return {slug};
    }

    console.log("Fetched results for event", slug);

    res.event["slug"] = slug;
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
export function getEventsResults(client, slugs, numEntrants = 192, limiter = null){
    return Promise.all(slugs.map((slug) => getEventResults(client, slug, numEntrants, limiter)
        .catch((err) => console.warn("Slug", slug, "kaput : ", err))
        .then(data => Object.assign(data, {slug}))
    ));
}
