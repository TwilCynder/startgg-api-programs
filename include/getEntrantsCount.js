import { Query } from './lib/query.js';
import { readSchema } from './lib/lib.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventEntrantsCount.txt");
const query = new Query(schema, 3);

export async function getEntrantsCount(client, slug, limiter, silentErrors = false){
    let data = await query.execute(client, {slug}, limiter, silentErrors);
    console.log("Fetched entrants count for slug", slug);
    if (!data.event) return null;
    return data.event.numEntrants;
}

export async function getEntrantsCountOverLeague(client, eventSlugs, limiter = null){ 
    let cs = await Promise.all(eventSlugs.map( async (slug) => {
        await getEntrantsCount(client, slug, limiter, false);
    }))

    let count = cs.reduce(((prev, current) => prev + current), 0)

    return count;
}
