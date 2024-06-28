import { Query } from "./lib/query.js";
import { deep_get, readSchema } from './lib/lib.js';

let schema = readSchema(import.meta.url, "./GraphQLSchemas/VideogameCharacters.txt");

let query = new Query(schema, 2)
query.log = {
    query: (params) => "Fetching characters for videogame " + params.slug,
    error: (params) => "Couldn't fetch characters for videogame " + params.slug
}

export async function getVideogameCharacters(client, slug){
    let result = await query.execute(client, {slug});
    console.log("Fetched characters for videogame", slug);
    return deep_get(result, "videogame.characters");
}