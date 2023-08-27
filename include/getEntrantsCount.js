import { readFileSync } from 'fs';
import { relurl } from './lib/dirname.js';


const schemaFilename = "./GraphQLSchemas/EventEntrantsCount.txt";

const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

export async function getEntrantsCount_(client, slug, tries, silentErrors = false){
    console.log("Getting entrants from event : ", slug);
    try {
        let data = await client.request(schema, {
            slug: slug
        });
        if (data && data.event){
            console.log("Successfully fetched entrants for", slug, "!");
            return data.event.numEntrants;
        }
        return null;
    } catch (e) {
        if (tries > 2) throw e;
        console.log(`/!\\ Request failed for slug ${slug}. Retrying.`);
        return getEntrantsCount(client, slug,  + 1, silentErrors);
    }
}

export async function getEntrantsCount(client, slug, silentErrors = false){
    return getEntrantsCount_(client, slug, 0, silentErrors);
}

export async function getEntrantsCountOverLeague(client, eventSlugs){
    let count = 0;

    await Promise.all(eventSlugs.map( async (slug) => {
        let c = await getEntrantsCount(client, slug, false);
        count += c
    }))

    return count;
}
