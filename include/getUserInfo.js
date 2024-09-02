import { Query } from './lib/query.js';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserInfo.txt");
const query = new Query(schema, 3);

query.log = {
  query: params => `Fetching info for user ${params.slug} ...`,
  error: params => `Request failed for user ${params.slug} ...`
}

export async function getUserInfo(client, slug, limiter = null, silentErrors = false){
  let data = await query.execute(client, {slug}, limiter, silentErrors);
  console.log("Fetched info for user slug", slug);
  if (!data.user) return null;
  return data.user;

}

export function getUsersInfo(client, slugs, limiter = null, silentErrors = false){
  return Promise.all(slugs.map((slug) => getUserInfo(client, slug, limiter, silentErrors).catch((err) => console.log("User slug", slug, "kaput : ", err))));
}