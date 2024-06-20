import { Query } from './lib/query.js';
import { readSchema } from './lib/lib.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserInfo.txt");
const query = new Query(schema, 3);

export async function getUserInfo(client, slug, limiter = null){
  let data = await query.execute(client, {slug}, limiter, silentErrors);
  console.log("Fetched info for user slug", slug);
  if (!data.user) return null;
  return data.user;

}

export function getUsersInfo(client, slugs, limiter = null){
  return Promise.all(slugs.map((slug) => getUserInfo(client, slug, limiter).catch((err) => console.log("User slug", slug, "kaput : ", err))));
}