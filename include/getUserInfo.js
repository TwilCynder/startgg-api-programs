import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';
import { getUserInfoGeneric, getUsersInfoGeneric, getUsersInfoGenericFromObjects } from './getUserInfoExtendedGeneric.js';


const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserInfo.gql");
const query = new Query(schema, 3);

query.log = {
  query: params => `Fetching info for user ${params.slug} ...`,
  error: params => `Request failed for user ${params.slug} ...`
}

export function getUserInfo(client, slug, limiter = null, silentErrors = false){
  return getUserInfoGeneric(query, client, slug, limiter, silentErrors);
}

export function getUsersInfo(client, slugs, limiter = null, silentErrors = false){
  return getUsersInfoGeneric(query, client, slugs, limiter, silentErrors);
}

export function getUsersInfoFromObjects(client, users, limiter, silentErrors){
  return getUsersInfoGenericFromObjects(query, client, users, limiter, silentErrors);
}