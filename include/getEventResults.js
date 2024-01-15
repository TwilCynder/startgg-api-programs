import { readFileSync } from 'fs';
import { Query } from './lib/query.js';
import { relurl } from './lib/dirname.js';

const schemaFilename = "./GraphQLSchemas/EventStanding.txt";

const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});
const query = new Query(schema, 4);

export async function getEventResults(client, slug, numEntrants = 192, limiter = null){
    console.log("Getting standings from event : ", slug);
    try {
        let res = await query.execute(client, {slug, numEntrants}, limiter);
        if (!res.event) throw "Slug " + slug + " not found.";

        console.log("Fetched infos for event", slug);
    
        res.event["slug"] = slug;

        return res.event;
    } catch (e) {
        console.log("Could not retrieve info for slug " + slug);
        return null;
    }
}

export function getEventsResults(client, slugs, numEntrants = 192, limiter = null){
    return Promise.all(slugs.map((slug) => getEventResults(client, slug, numEntrants, limiter).catch((err) => console.log("Slug", slug, "kaput : ", err))));
}