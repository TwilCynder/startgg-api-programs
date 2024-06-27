import { Query } from './lib/query.js';
import { readSchema } from './lib/lib.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventStanding.txt");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching results from event ${params.slug} ...`,
    error: params => `Request failed for event ${params.slug} ...`
}

export async function getEventResults(client, slug, numEntrants = 192, limiter = null){
    console.log("Getting standings from event : ", slug);

    let res = await query.execute(client, {slug, numEntrants}, limiter);
    if (!res.event) return null;

    console.log("Fetched results for event", slug);

    res.event["slug"] = slug;

    return res.event;

}

export function getEventsResults(client, slugs, numEntrants = 192, limiter = null){
    return Promise.all(slugs.map((slug) => getEventResults(client, slug, numEntrants, limiter).catch((err) => console.log("Slug", slug, "kaput : ", err))));
}
