import { Query } from 'startgg-helper';
import { getQueryLogConfig, getSetsInEvent, getSetsInEvents, getSetsInEventsFromObjects, getSetsInEventsHashmap, getSetsInEventsSeparated} from './getSetsInEvents.js';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventSets.gql");
const query = new Query(schema, 3);

query.log = getQueryLogConfig("base info");

export function getEventSetsBasic(client, slug, limiter){
    return getSetsInEvent(client, query, slug, limiter);
}

export function getEventsSetsBasic(client, slugs, limiter){
    return getSetsInEvents(client, query, slugs, limiter);
}

export function getEventsSetsBasicSeparated(client, slugs, limiter){
    return getSetsInEventsSeparated(client, query, slugs, limiter);
}

export function getEventsSetsBasicHashmap(client, slugs, limiter){
    return getSetsInEventsHashmap(client, query, slugs, limiter);
}

export function getEventsSetsBasicFromObjects(client, events, limiter){
    return getSetsInEventsFromObjects(client, query, events, limiter);
}