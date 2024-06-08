import { readFileSync } from 'fs';
import { relurl } from './lib/dirname.js';
import { Query } from './lib/query.js';

const schemaFilename = "./GraphQLSchemas/EventEntrants.txt";
const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

const query = new Query(schema, 4);

/*
export async function getEntrants_(client, slug, tries, limiter = null, silentErrors = false){
    console.log("Getting entrants from event : ", slug);
    try {
        let params = {slug};
        let data = await (limiter ? limiter.execute(client, schema, params) : client.request(schema, {slug}));
        if (data && data.event){
            console.log("Successfully fetched entrants for", slug, "!");
            return data.event.entrants.nodes;
        }
        return null;
    } catch (e) {
        if (tries > 2) throw e;
        console.log(`/!\\ Request failed for slug ${slug}. Retrying.`);
        return getEntrants_(client, slug, tries + 1, silentErrors);
    }
}
*/

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string} slug 
 * @param {DelayQueryLimiter} limiter 
 * @param {boolean} silentErrors 
 * @returns 
 */
export async function getEntrants(client, slug, limiter, silentErrors = false){
    let data = await query.execute(client, {slug}, limiter, silentErrors);
    console.log("Fetched entrans for slug", slug);
    if (!data.event) return null;

    return data.event.entrants.nodes;
    //return getEntrants_(client, slug, 0, limiter, silentErrors);
}

/**
 * @param {GraphQLClient} client 
 * @param {string[]} slugs 
 * @param {DelayQueryLimiter} limiter 
 * @param {boolean} silentErrors 
 * @returns 
 */
export function getEntrantsForEvents(client, slugs, limiter, silentErrors = false){
    return Promise.all(slugs.map( async slug => ({
        entrants: await getEntrants(client, slug, limiter, silentErrors).catch( err => console.log("Slug", slug, "kaput : ", err)), 
        slug
    })));
}

export async function getUniqueUsersOverLeague(client, slugs, limiter, silentErrors = false){

    let data = (await getEntrantsForEvents(client, slugs, limiter, silentErrors)).reduce((acc, event, index) => {
        if (!event) return acc;
        for (let entrant of event.entrants){
            for (let participant of entrant.participants){
                if (participant.user){
                    acc[participant.user.id] = participant.user;
                } else if (!silentErrors){
                    console.warn("Entrant", entrant.id, `(${entrant.name})`, "at event", event.slug, "doesn't have a user account associated.");
                }
            }
        }
        return acc;
    }, {})

    return Object.values(data);
}