import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';
import { executeWithSaveManager } from './progressSaver.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventEntrantsCount.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching entrants count from event ${params.slug} ...`,
    error: params => `Request failed for event ${params.slug} ...`
}

export async function getEntrantsCount(client, slug, limiter, silentErrors = false, saveManager){
    let data = await executeWithSaveManager(query, saveManager, slug, client, {slug}, limiter, silentErrors);
    //let data = await query.execute(client, {slug}, limiter, silentErrors);
    if (!data.event) {
        console.warn("Couldn't fetch entrants for slug", slug);
        return null
    };
    console.log("Fetched entrants count for slug", slug,":", data.event.numEntrants);
    return data.event.numEntrants;
}

export function getEntrantsCountFromObjects(query, client, events, limiter, silentError = false){
    return Promise.all(events.map( async event => {
        if (!event.slug) {
            console.error("Event object with no slug :", event);
            return event;
        }
        const count = await getEntrantsCount(query, client, event.slug, limiter, silentError);
        event.numEntrants = count;
        return event;
    }));
}

export async function getEntrantsCountOverLeague(client, eventSlugs, limiter = null, saveManager){ 
    let cs = await Promise.all(eventSlugs.map( async (slug) => await getEntrantsCount(client, slug, limiter, false, saveManager)))

    let count = cs.reduce(((prev, current) => {
        return prev + current;
    }), 0);

    return count;
}
