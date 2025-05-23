import { Query } from "startgg-helper-node";
import { readSchema } from './lib/util.js';
import { deep_get } from './lib/jsUtil.js';

let schema = readSchema(import.meta.url, "./GraphQLSchemas/VideogameID.gql");

let query = new Query(schema, 2)
query.log = {
    query: (params) => "Fetching ID for videogame " + params.slug,
    error: (params) => "Couldn't fetch ID for videogame " + params.slug
}

export async function getVideogameID(client, slug, limiter){
    let result = await query.execute(client, {slug}, limiter);
    let res = deep_get(result, "videogame.id");
    if (!res){
        console.warn("ID not found for videogame", slug);
        return null;
    }
    console.log("Fetched ID for videogame", slug);
    return res;
}