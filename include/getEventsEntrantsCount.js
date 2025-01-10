import { Query } from './lib/query.js';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventEntrantsCount.txt");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching event info for event ${params.slug} ...`,
    error: params => `Request failed for event ${params.slug} ...`
}

export async function getEventEntrantCount(client, slug, limiter = null){
    let res = await query.execute(client, {slug}, limiter);

    if (!res.event) throw "Slug " + slug + " not found.";

    console.log("Fetched infos for event", slug);

    return res.event;
}

export function getEventsEntrantCount(client, slugs, limiter){
    return Promise.all(slugs.map((slug) => getEventEntrantCount(client, slug, limiter)
        .catch((err) => console.log("Slug", slug, "kaput : ", err))
        .then(data => Object.assign(data, {slug}))
    ));
}