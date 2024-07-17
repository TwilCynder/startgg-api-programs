import { Query } from './lib/query.js';
import { readSchema } from './lib/lib.js';
import { getSetsInEvent, getSetsInEvents, reduceSetsInEvents } from './getSetsInEvents.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventSetsCharacter.txt");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from event ${params.slug}, page ${params.page} (${params.perPage} entries per page) ...`,
    error: params => `Request failed for event ${params.slug}, page ${params.page} (${params.perPage} entries per page) ...`
}

export async function getSetsCharsInEvent(client, slug, limiter){
    return await getSetsInEvent(client, query, slug, limiter);
}

export async function getSetsCharsInEvents(client, slugs, limiter){
    return await getSetsInEvents(client, query, slugs, limiter);
}


function updateCharsCount(chars, sets){
    for (let set of sets){
        if (!set.games) continue;
        for (let game of set.games){
            if (!game.selections) continue;
            for (let selection of game.selections){
                let char = selection.selectionValue;

                if (!chars[char]) chars[char] = 0;
                chars[char]++;
            }
        }
    }
    return chars;
}

export function getCharsInSets(sets){
    return updateCharsCount({}, sets);
}

export async function getCharsInEvent(client, slug, limiter){
    return getCharsInSets(await getSetsCharsInEvent(client, slug, limiter));
}

export async function getCharsInEvents(client, slugs, limiter = null){
    let chars = await reduceSetsInEvents(client, query, slugs, (chars, sets) => {
        console.log("Reducing", chars);
        if (!sets) return chars;    
        return updateCharsCount(chars, sets);
    }, {}, limiter)
    console.log(chars);

    return chars;
}