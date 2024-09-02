import { Query } from "./lib/query.js";
import { readSchema } from './lib/util.js';
import { deep_get } from './lib/jsUtil.js';

let schema = readSchema(import.meta.url, "./GraphQLSchemas/VideogameCharacters.txt");

let query = new Query(schema, 2)
query.log = {
    query: (params) => "Fetching characters for videogame " + params.slug,
    error: (params) => "Couldn't fetch characters for videogame " + params.slug
}

export async function getVideogameCharacters(client, slug, limiter){
    let result = await query.execute(client, {slug}, limiter);
    console.log("Fetched characters for videogame", slug);
    return deep_get(result, "videogame.characters");
}