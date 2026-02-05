import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';
import { getSetsInEvent, getSetsInEvents, getSetsInEventsFromObjects, reduceSetsInEvents } from './getSetsInEvents.js';
import { processSets } from './processCharacterStats.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventSetsCharacter.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from event ${params.slug} with character info and detailed player info, page ${params.page} (${params.perPage} entries per page) ...`,
    error: params => `Request failed for event ${params.slug}, page ${params.page} (${params.perPage} entries per page) ...`
}

export function getSetsCharsDetailedInEvent(client, slug, limiter){
    return getSetsInEvent(client, query, slug, limiter);
}

export function getSetsCharsDetailedInEvents(client, slugs, limiter){
    return getSetsInEvents(client, query, slugs, limiter);
}

export function getSetsCharsDetailedInEventsSeparated(client, slugs, limiter){
    return getSetsInEventsSeparated(client, query, slugs, limiter);
}

export function getSetsCharsDetailedInEventsHashMap(client, slugs, limiter){
    return getSetsInEventsHashmap(client, query, slugs, limiter);
}

export function getSetsCharsDetailedInEventsFromObjects(client, events, limiter){
    return getSetsInEventsFromObjects(client, query, events, limiter);
}

export async function getCharsDetailedInEvent(client, slug, limiter, updateFunction){
    return getCharsStatsInSets(await getSetsCharsDetailedInEvent(client, slug, limiter), updateFunction);
}

export async function getCharsDetailedInEvents(client, slugs, limiter, updateFunction){
    let chars = await reduceSetsInEvents(client, query, slugs, (chars, sets) => {
        console.log("Reducing", chars);
        if (!sets) return chars;
        return processSets(chars, sets, updateFunction);
    }, {}, limiter)

    return chars;
}