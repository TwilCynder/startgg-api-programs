import { getEntrants, getEntrantsForEvents, getUniqueUsersOverLeague } from './getEntrantsGeneric.js';
import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventEntrantsExtended.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching entrants from event ${params.slug}`,
    error: params => `Request failed for event ${params.slug}`
}

export function getEntrantsExtended(client, slug, limiter, silentErrors){
    return getEntrants(query, client, slug, limiter, silentErrors);
}

export function getEntrantsExtendedForEvents(client, slugs, limiter, silentErrors){
    return getEntrantsForEvents(query, client, slugs, limiter, silentErrors);
}

export function getUniqueUsersExtendedOverLeague(client, slugs, limiter, silentErrors){
    return getUniqueUsersOverLeague(query, client, slugs, limiter, silentErrors);
}