import { Query } from './lib/query.js';
import { getSetsInEvent, getSetsInEvents} from './getSetsInEvents.js';
import { readSchema } from './lib/lib.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventSets.txt");
const query = new Query(schema, 3);

export function getEventSetsBasic(client, slug, limiter){
    return getSetsInEvent(client, query, slug, limiter);
}

export function getEventsSetsBasic(client, slugs, limiter){
    return getSetsInEvents(client, query, slugs, limiter);
}