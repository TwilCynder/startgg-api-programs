import { Query } from './lib/query.js';
import { readSchema } from './lib/lib.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventStanding.txt");
const query = new Query(schema, 3);

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
