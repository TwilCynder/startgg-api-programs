import {readFileSync} from 'fs';
import { relurl } from './lib/dirname.js';
import { Query } from './lib/query.js   ';
import { QueryLimiter } from './lib/queryLimiter.js';

const schemaFilename = "./GraphQLSchemas/EventSetsCharacter.txt"
const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

let query = new Query(schema, 2);
query.log = {
    query: params => `Fetching sets from event ${params.slug}, page ${params.page}`,
    error: params => `Request failed for event ${params.slug}, page ${params.page}`
}

export async function getSetsCharsInEvent(client, slug, limiter){
    let sets = await query.executePaginated(client, {slug, perPage: 50}, "event.sets.nodes", limiter);
    return sets;
}

export async function getSetsCharsInEvents(client, eventSlugs, limiter){
    let bigarray = await Promise.all(eventSlugs.map( (slug) => {
        return getSetsCharsInEvent(client, slug);
    }));

    let result = [];
    for (arr of bigarray){
        result += arr;
    }

    return result;
}

export async function getCharsInEvent(client, slug, limiter){
    let sets = await getSetsCharsInEvent(client, slug, limiter);

    let chars = {}

    for (let set of sets){
        if (!set.games) continue;
        for (let game of set.games){
            for (let selection of game.selections){
                let char = selection.selectionValue;

                if (!chars[char]) chars[char] = 0;
                chars[char]++;
            }
        }
    }

    return chars;
}

export async function getCharsInEvents(client, slugs){
    let limiter = new QueryLimiter(39);

    let events = await Promise.all(slugs.map( async (slug) => {
        try {
            return await getCharsInEvent(client, slug, limiter);
        } catch (err) {
            console.log("Slug", slug, "kaput.", err);
        }
    } ));

    let chars = {}

    for (let eventChars of events) {
        if (!eventChars) return;
        for (let char in eventChars){
            if (!chars[char]) chars[char] = 0;
            chars[char] += eventChars[char];
        }
    }

    return chars;
}