import { readFileSync } from 'fs';
import { relurl } from './lib/dirname.js';
import { Query } from './lib/query.js';


const schemaFilename = "./GraphQLSchemas/PlayerName.txt";
const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});
const query = new Query(schema, 4);

export async function getPlayerName(client, slug, limiter = null, silent = false){
    if (!silent) console.log("Getting standings from player : ", slug);
    try {
        let res = await query.execute(client, {slug}, limiter);
        if (!res.user) throw "Slug " + slug + " not found.";

        if (!silent) console.log("Fetched name for user ", slug);
    
        return res.user.player.gamerTag;
    } catch (e) {
        if (!silent) console.error("Could not retrieve info for slug " + slug + " : " + e);
        return null;
    }
}

export function getPlayersNames(client, slugs, limiter = null){
    return Promise.all(slugs.map((slug) => getPlayerName(client, slug, limiter).catch((err) => console.log("User slug", slug, "kaput : ", err))));
}

