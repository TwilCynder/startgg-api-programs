import {readFileSync} from 'fs';
import { relurl } from './lib/dirname.js';
import { Query } from './lib/query.js   ';
import { ClockQueryLimiter, StartGGClockQueryLimiter, StartGGDelayQueryLimiter } from './lib/queryLimiter.js';
import { getSetsInEvent, getSetsInEvents, reduceSetsInEvents } from './getSetsInEvents.js';

const schemaFilename = "./GraphQLSchemas/EventSetsCharacter.txt"
const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

let query = new Query(schema, 2);
query.log = {
    query: params => `Fetching sets from event ${params.slug}, page ${params.page}`,
    error: params => `Request failed for event ${params.slug}, page ${params.page}`
}

export async function getSetsCharsInEvent(client, slug, limiter){
    let sets = await getSetsInEvent(client, query, slug, limiter);
    return sets;
}

export async function getSetsCharsInEvents(client, eventSlugs, limiter){
    let sets = await getSetsInEvents(client, query, slugs, limiter);
    return sets;
}

function updateCharsCount(chars, sets){
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

export async function getCharsInEvent(client, slug, limiter){
    let sets = await getSetsCharsInEvent(client, slug, limiter);

    return updateCharsCount({}, sets);
}

export async function getCharsInEvents(client, slugs){
    let limiter = new StartGGDelayQueryLimiter;

    let chars = await reduceSetsInEvents(client, query, slugs, (chars, sets) => {
        console.log("Reducing", chars);
        if (!sets) return chars;    
        return updateCharsCount(chars, sets);
    }, {}, limiter)
    console.log(chars);

    return chars;
}