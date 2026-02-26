import { Query } from 'startgg-helper';
import { getQueryLogConfig, getSetsInEvent, getSetsInEvents, getSetsInEventsFromObjects, getSetsInEventsHashmap} from './getSetsInEvents.js';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventSetsGames.gql");
const query = new Query(schema, 3);

query.log = getQueryLogConfig("with games");

export function getEventSetsGames(client, slug, limiter){
    return getSetsInEvent(client, query, slug, limiter);
}

export function getEventsSetsGames(client, slugs, limiter){
    return getSetsInEvents(client, query, slugs, limiter);
}

export function getEventsSetsGamesFromObjects(client, events, limiter){
    return getSetsInEventsFromObjects(client, query, events, limiter);
}

export function getEventsSetsGamesSeparated(client, slugs, limiter){
    return Promise.all(slugs.map(slug => getEventSetsGames(client, slug, limiter)))
}

export async function getEventsSetsGamesHashmap(client, slugs, limiter){
    return getSetsInEventsHashmap(client, query, slugs, limiter);
}   