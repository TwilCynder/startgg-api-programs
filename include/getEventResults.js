import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { relurl } from './lib/dirname.js';

const schemaFilename = "./GraphQLSchemas/EventStanding.txt";

const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

export async function getEventResults(client, slug){
    console.log("Getting standings from event : ", slug);
    try {
        return await client.request(schema, {
            slug: slug
        });
    } catch (e) {
        console.log("/!\\ Request failed, retrying.", "Message : ", e);
        return getEventStandings(client, slug);
    }
}