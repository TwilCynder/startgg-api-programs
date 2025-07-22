import { Query } from 'startgg-helper';
import { getSetsInEvent, getSetsInEvents, getSetsInEventsHashmap} from './getSetsInEvents.js';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventSetsGames.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from event ${params.slug} ...`,
    error: params => `Request failed for event ${params.slug} ...`
}

export function getEventSetsGames(client, slug, limiter){
    return getSetsInEvent(client, query, slug, limiter);
}

export function getEventsSetsGames(client, slugs, limiter){
    return getSetsInEvents(client, query, slugs, limiter);
}

export function getEventsSetsGamesSeparated(client, slugs, limiter){
    return Promise.all(slugs.map(slug => getEventSetsGames(client, slug, limiter)))
}

export async function getEventsSetsGamesHashmap(client, slugs, limiter){
    return getSetsInEventsHashmap(client, query, slugs, limiter);
}   