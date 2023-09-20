import {readFileSync} from 'fs';
import { relurl } from './lib/dirname.js';
import { Query } from "./lib/query.js";

const schemaFilename = "./GraphQLSchemas/VideogameCharacters.txt";

let schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

let query = new Query(schema, 2)
query.log = {
    query: (params) => "Fetching characters for videogame " + params.slug,
    error: (params) => "Couldn't fetch characters for videogame " + params.slug
}

export async function getCharacters(client, slug){
    let result = await query.execute(client, {slug});
    return result;
}

