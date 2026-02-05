import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';
import { getUserSetsGeneric, getUsersSetsGeneric } from './getUserSetsGeneric.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserSets.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from user ${params.slug} ...`,
    error: params => `Request failed for user ${params.slug} ...`
}

export async function getUserSets(client, slug, limiter, after, until){
    return getUserSetsGeneric(query, client, slug, limiter, {after, until});
}

export function getUsersSets(client, slugs, limiter, after, until){
    return getUsersSetsGeneric(query, client, slugs, limiter, {after, until});
}
