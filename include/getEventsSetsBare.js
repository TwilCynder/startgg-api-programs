import { Query } from 'startgg-helper';
import { getSetsInEvent, getSetsInEvents, getSetsInEventsHashmap} from './getSetsInEvents.js';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventSetsBare.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from event ${params.slug} ...`,
    error: params => `Request failed for event ${params.slug} ...`
}

export function getEventSetsBare(client, slug, limiter, progressManager){
    return getSetsInEvent(client, query, slug, limiter, progressManager);
}

export function getEventsSetsBare(client, slugs, limiter, progressManager){
    return getSetsInEvents(client, query, slugs, limiter, progressManager);
}

export function getEventsSetsBareSeparated(client, slugs, limiter){
    return Promise.all(slugs.map(slug => getEventSetsBare(client, slug, limiter)))
}

export async function getEventsSetsBareHashmap(client, slugs, limiter){
    return getSetsInEventsHashmap(client, query, slugs, limiter);
}