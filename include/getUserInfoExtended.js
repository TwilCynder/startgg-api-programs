import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';
import { getUserInfoGeneric, getUsersInfoGeneric, getUsersInfoGenericFromObjects } from './getUserInfoExtendedGeneric.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserInfoExtended.gql");
const query = new Query(schema, 3);

query.log = {
  query: params => `Fetching info for user ${params.slug} ...`,
  error: params => `Request failed for user ${params.slug} ...`
}

export function getUserInfoExtended(client, slug, limiter = null, silentErrors = false){
  return getUserInfoGeneric(query, client, slug, limiter, silentErrors);
}

export function getUsersInfoExtended(client, slugs, limiter = null, silentErrors = false){
  return getUsersInfoGeneric(query, client, slugs, limiter, silentErrors);
}

export function getUsersInfoExtendedFromObjects(client, users, limiter, silentErrors){
  return getUsersInfoGenericFromObjects(query, client, users, limiter, silentErrors);
}