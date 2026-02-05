import { GraphQLClient } from 'graphql-request';
import { processUniqueEntrantsLeague } from './uniqueEntrantsUtil.js';

/*
export async function getEntrants_(client, slug, tries, limiter = null, silentErrors = false){
    console.log("Getting entrants from event : ", slug);
    try {
        let params = {slug};
        let data = await (limiter ? limiter.execute(client, schema, params) : client.request(schema, {slug}));
        if (data && data.event){
            console.log("Successfully fetched entrants for", slug, "!");
            return data.event.entrants.nodes;
        }
        return null;
    } catch (e) {
        if (tries > 2) throw e;
        console.log(`/!\\ Request failed for slug ${slug}. Retrying.`);
        return getEntrants_(client, slug, tries + 1, silentErrors);
    }
}
*/

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string} slug 
 * @param {DelayQueryLimiter} limiter 
 * @param {boolean} silentErrors 
 * @returns 
 */
export async function getEntrants(query, client, slug, limiter, silentErrors = false){
    let data = await query.execute(client, {slug}, limiter, silentErrors);
    if (!data.event) {
        console.warn("Couldn't fetch entrants for slug", slug);
        return null
    };
    console.log("Fetched entrants for slug", slug);
    return data.event.entrants.nodes;
    //return getEntrants_(client, slug, 0, limiter, silentErrors);
}

/**
 * @param {GraphQLClient} client 
 * @param {string[]} slugs 
 * @param {DelayQueryLimiter} limiter 
 * @param {boolean} silentErrors 
 * @returns 
 */
export function getEntrantsForEvents(query, client, slugs, limiter, silentErrors = false){
    return Promise.all(slugs.map( async slug => ({
        entrants: await getEntrants(query, client, slug, limiter, silentErrors).catch( err => console.log("Slug", slug, "kaput : ", err)), 
        slug
    })));
}

export function getEntrantsFromObjects(query, client, events, limiter, silentError = false){
    return Promise.all(events.map( async event => {
        if (!event.slug) {
            console.error("Event object with no slug :", event);
            return event;
        }
        const entrants = await getEntrants(query, client, event.slug, limiter, silentError);
        event.entrants = entrants;
        return event;
    }));
}

export async function getUniqueUsersOverLeague(query, client, slugs, limiter, silentErrors = false){
    let data = (await getEntrantsForEvents(query, client, slugs, limiter, silentErrors))

    return processUniqueEntrantsLeague(data, silentErrors);
}