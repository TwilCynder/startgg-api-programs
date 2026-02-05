import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';
import { getSetsInEvent, getSetsInEvents, getSetsInEventsFromObjects, getSetsInEventsHashmap, getSetsInEventsSeparated, reduceSetsInEvents } from './getSetsInEvents.js';
import { processSets } from './processCharacterStats.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventSetsCharacterOnly.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from event ${params.slug} with character info, page ${params.page} (${params.perPage} entries per page) ...`,
    error: params => `Request failed for event ${params.slug}, page ${params.page} (${params.perPage} entries per page) ...`
}

export function getSetsCharsInEvent(client, slug, limiter){
    return getSetsInEvent(client, query, slug, limiter);
}

export function getSetsCharsInEvents(client, slugs, limiter){
    return getSetsInEvents(client, query, slugs, limiter);
}

export function getSetsCharsInEventsSeparated(client, slugs, limiter){
    return getSetsInEventsSeparated(client, query, slugs, limiter);
}

export function getSetsCharsInEventsHashMap(client, slugs, limiter){
    return getSetsInEventsHashmap(client, query, slugs, limiter);
}

export function getSetsCharsInEventsFromObjects(client, events, limiter){
    return getSetsInEventsFromObjects(client, query, events, limiter);
}

export async function getCharsInEvent(client, slug, limiter, updateFunction){
    return getCharsStatsInSets(await getSetsCharsInEvent(client, slug, limiter), updateFunction);
}

export async function getCharsInEvents(client, slugs, limiter, updateFunction){
    let chars = await reduceSetsInEvents(client, query, slugs, (chars, sets) => {
        console.log("Reducing", chars);
        if (!sets) return chars;
        return processSets(chars, sets, updateFunction);
    }, {}, limiter)

    return chars;
}