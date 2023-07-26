import { readFileSync } from 'fs';
import { relurl } from './lib/dirname.js';


const schemaFilename = "./GraphQLSchemas/LastStandings.txt";

const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

async function getLastStandings_(client, slug, tries){
    if (!slug) return;
    console.log("Querying " + slug)
    try {
        let res = await client.request(schema, {
            slug: slug
        });
        return res.user ? res : slug;
    } catch (e) {
        if (tries > 2) throw e;
        console.log(`/!\\ Request failed for slug ${slug}. Retrying.`);
        return getLastStandings_(client, slug, tries + 1);
    }
}

export async function getLastStandings(client, slug){
    return getLastStandings_(client, slug, 0)
}

export async function getPlayersLastStandings(client, slugs){
    let players = []
    await Promise.all(slugs.map( (slug) => getLastStandings(client, slug)))
        .then(values => players = values);
    return players;
}
