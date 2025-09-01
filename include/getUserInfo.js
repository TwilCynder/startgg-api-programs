import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserInfo.gql");
const query = new Query(schema, 3);

query.log = {
  query: params => `Fetching info for user ${params.slug} ...`,
  error: params => `Request failed for user ${params.slug} ...`
}

export async function getUserInfo(client, slug, limiter = null, silentErrors = false){
  let data = await query.execute(client, {slug}, limiter, silentErrors);
  if (!data.user) {
    console.warn("Coulnd't fetch info for user slug", slug);
    return null;
  }
  console.log("Fetched info for user slug", slug);
  return data.user;

}

export function getUsersInfo(client, slugs, limiter = null, silentErrors = false){
  return Promise.all(slugs.map((slug) => getUserInfo(client, slug, limiter, silentErrors).catch((err) => console.log("User slug", slug, "kaput : ", err))));
}