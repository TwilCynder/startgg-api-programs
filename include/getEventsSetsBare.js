import { Query } from 'startgg-helper';
import { getQueryLogConfig, getSetsInEvent, getSetsInEvents, getSetsInEventsFromObjects, getSetsInEventsHashmap, getSetsInEventsSeparated} from './getSetsInEvents.js';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventSetsBare.gql");
const query = new Query(schema, 3);

query.log = getQueryLogConfig("bare info");

export function getEventSetsBare(client, slug, limiter, progressManager){
    return getSetsInEvent(client, query, slug, limiter, progressManager);
}

export function getEventsSetsBare(client, slugs, limiter, progressManager){
    return getSetsInEvents(client, query, slugs, limiter, progressManager);
}

export function getEventsSetsBareSeparated(client, slugs, limiter){
    return getSetsInEventsSeparated(client, query, slugs, limiter);
}

export async function getEventsSetsBareHashmap(client, slugs, limiter, progressManager){
    return getSetsInEventsHashmap(client, query, slugs, limiter, progressManager);
}

export function getEventsSetsBareFromObjects(client, events, limiter, progressManager){
    return getSetsInEventsFromObjects(client, query, events, limiter, progressManager);
}