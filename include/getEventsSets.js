import { Query } from './lib/query.js';
import { getSetsInEvent, getSetsInEvents, getSetsInEventsHashmap} from './getSetsInEvents.js';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventSets.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from event ${params.slug} ...`,
    error: params => `Request failed for event ${params.slug} ...`
}

export function getEventSetsBasic(client, slug, limiter){
    return getSetsInEvent(client, query, slug, limiter);
}

export function getEventsSetsBasic(client, slugs, limiter){
    return getSetsInEvents(client, query, slugs, limiter);
}

export function getEventsSetsBasicSeparated(client, slugs, limiter){
    return Promise.all(slugs.map(slug => getEventSetsBasic(client, slug, limiter)))
}

export async function getEventsSetsBasicHashmap(client, slugs, limiter){
    return getSetsInEventsHashmap(client, query, slugs, limiter);
}