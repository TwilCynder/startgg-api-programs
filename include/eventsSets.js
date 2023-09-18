import {readFileSync} from 'fs';
import { relurl } from './lib/dirname.js';
import { Query } from "./lib/query.js";

const schemaFilename = "./GraphQLSchemas/EventSets.txt"
let schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"})

let query = new Query(schema, 2);

export async function getSetsInEvent(client, slug){
    return await query.executePaginated(client, {
        slug: slug,
        perPage: 100
    }, "event.sets.nodes")
}

