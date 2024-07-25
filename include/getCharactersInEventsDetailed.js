import { Query } from './lib/query.js';
import { readSchema } from './lib/lib.js';
import { getSetsInEvent, getSetsInEvents, reduceSetsInEvents } from './getSetsInEvents.js';
import { processSets } from './processCharacterStats.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventSetsCharacterDetailed.txt");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from event ${params.slug} with character info and detailed player info, page ${params.page} (${params.perPage} entries per page) ...`,
    error: params => `Request failed for event ${params.slug}, page ${params.page} (${params.perPage} entries per page) ...`
}

export async function getSetsCharsDetailedInEvent(client, slug, limiter){
    return await getSetsInEvent(client, query, slug, limiter);
}

export async function getSetsCharsDetailedInEvents(client, slugs, limiter){
    return await getSetsInEvents(client, query, slugs, limiter);
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
    console.log(chars);

    return chars;
}