import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';
import { getSetsInEvent, getSetsInEvents, reduceSetsInEvents } from './getSetsInEvents.js';
import { processSets } from './processCharacterStats.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventSetsCharacterOnly.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from event ${params.slug} with character info, page ${params.page} (${params.perPage} entries per page) ...`,
    error: params => `Request failed for event ${params.slug}, page ${params.page} (${params.perPage} entries per page) ...`
}

export async function getSetsCharsInEvent(client, slug, limiter){
    return await getSetsInEvent(client, query, slug, limiter);
}

export async function getSetsCharsInEvents(client, slugs, limiter){
    return await getSetsInEvents(client, query, slugs, limiter);
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
    console.log(chars);

    return chars;
}