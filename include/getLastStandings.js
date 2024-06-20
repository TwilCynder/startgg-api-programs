import { Query } from './lib/query.js';
import { deep_get, readSchema } from './lib/lib.js';

const DEFAULT_COUNT = 20;

const schema = readSchema(import.meta.url, "./GraphQLSchemas/LastStandings.txt");
const query = new Query(schema, 3);

export async function getLastStandings(client, slug, limiter = null, count = DEFAULT_COUNT, silentErrors = false){
    let data = await query.execute(client, {slug, count}, limiter, silentErrors);
    console.log("Fetched last standings for slug", slug);
    let result = deep_get(data, "user.player.recentStandings");
    return result;
}

export async function getPlayersLastStandings(client, slugs, limiter = null, count = DEFAULT_COUNT){
    return await Promise.all(slugs.map( (slug) => getLastStandings(client, slug, limiter, count).catch(err => console.error("Slug", slug, "kaput :", err))))
}
