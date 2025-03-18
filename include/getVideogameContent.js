import { Query } from "./lib/query.js";
import { readSchema } from './lib/util.js';
import { deep_get } from './lib/jsUtil.js';

let schema = readSchema(import.meta.url, "./GraphQLSchemas/VideogameContent.txt");

let query = new Query(schema, 2)
query.log = {
    query: (params) => "Fetching characters for videogame " + params.slug,
    error: (params) => "Couldn't fetch characters for videogame " + params.slug
}

export async function getVideogameContent(client, slug, limiter){
    let res = await query.execute(client, {slug}, limiter);
    if (!res.videogame) {
        console.warn("Couldn't fetch content for videogame", slug);
        return null;
    }

    console.log("Fetched content for videogame", slug);

    return res.videogame;
}