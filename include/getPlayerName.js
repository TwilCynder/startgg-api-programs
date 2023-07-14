import { readFileSync } from 'fs';
import { relurl } from './lib/dirname.js';

const schemaFilename = "./PlayerName.txt";

const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

export async function getPlayerName(client, slug){
    try {
        let res = await client.request(schema, {
            slug: slug
        });
        console.log(res);
        return res.user ? res : slug;
    } catch (e) {
        console.log(`/!\\ Request failed for slug ${slug}. Retrying.`);
        return getPlayerName(client, slug);
    }
    
}

export async function getPlayersNames(client, slugs){
    let players = []
    await Promise.all(slugs.map( (slug) => getPlayerName(client, slug)))
        .then(values => players = values);
    return players;
}
