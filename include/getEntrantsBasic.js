import { getEntrants, getEntrantsForEvents, getUniqueUsersOverLeague } from './getEntrantsGeneric.js';
import { Query } from './lib/query.js';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventEntrants.txt");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching entrants from event ${params.slug}`,
    error: params => `Request failed for event ${params.slug}`
}

export function getEntrantsBasic(client, slug, limiter, silentErrors){
    return getEntrants(query, client, slug, limiter, silentErrors);
}

export function getEntrantsBasicForEvents(client, slugs, limiter, silentErrors){
    return getEntrantsForEvents(query, client, slugs, limiter, silentErrors);
}

export function getUniqueUsersBasicOverLeague(client, slugs, limiter, silentErrors){
    return getUniqueUsersOverLeague(query, client, slugs, limiter, silentErrors);
}