import { readFileSync } from 'fs';
import { relurl } from './lib/dirname.js';
import { Query } from './lib/query.js';

const schemaFilename = "./GraphQLSchemas/EventEntrants.txt";
const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

const query = new Query(schema, 4);

/*
export async function getEntrants_(client, slug, tries, limiter = null, silentErrors = false){
    console.log("Getting entrants from event : ", slug);
    try {
        let params = {slug};
        let data = await (limiter ? limiter.execute(client, schema, params) : client.request(schema, {slug}));
        if (data && data.event){
            console.log("Successfully fetched entrants for", slug, "!");
            return data.event.entrants.nodes;
        }
        return null;
    } catch (e) {
        if (tries > 2) throw e;
        console.log(`/!\\ Request failed for slug ${slug}. Retrying.`);
        return getEntrants_(client, slug, tries + 1, silentErrors);
    }
}
*/

export async function getEntrants(client, slug, limiter, silentErrors = false){
    let data = await query.execute(client, {slug}, limiter, silentErrors);
    console.log("Fetched entrans for slug", slug);
    if (!data.event) return null;

    return data.event.entrants.nodes;
    //return getEntrants_(client, slug, 0, limiter, silentErrors);
}
