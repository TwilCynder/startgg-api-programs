import { Query } from './lib/query.js';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventEntrantsCount.txt");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching entrants count from event ${params.slug} ...`,
    error: params => `Request failed for event ${params.slug} ...`
}

export async function getEntrantsCount(client, slug, limiter, silentErrors = false){
    let data = await query.execute(client, {slug}, limiter, silentErrors);
    if (!data.event) {
        console.warn("Couldn't fetch entrants for slug", slug);
        return null
    };
    console.log("Fetched entrants count for slug", slug);
    return data.event.numEntrants;
}

export async function getEntrantsCountOverLeague(client, eventSlugs, limiter = null){ 
    let cs = await Promise.all(eventSlugs.map( async (slug) => await getEntrantsCount(client, slug, limiter, false)))

    let count = cs.reduce(((prev, current) => {
        console.log(prev, current)
        return prev + current;
    }), 0);

    return count;
}
