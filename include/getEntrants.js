import { readFileSync } from 'fs';
import { relurl } from './lib/dirname.js';
import { updateEntrantsAttendance } from './entrantAttendanceUtilities.js';


const schemaFilename = "./GraphQLSchemas/EventEntrants.txt";

const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

export async function getEntrants_(client, slug, tries, silentErrors = false){
    console.log("Getting entrants from event : ", slug);
    try {
        let data = await client.request(schema, {
            slug: slug
        });
        if (data && data.event){
            console.log("Successfully fetched entrants for", slug, "!");
            return data.event.entrants.nodes;
        }
        return null;
    } catch (e) {
        if (tries > 2) throw e;
        console.log(`/!\\ Request failed for slug ${slug}. Retrying.`);
        return getEntrants(client, slug, tries + 1, silentErrors);
    }
}

export async function getEntrants(client, slug, tries, silentErrors = false){
    return getEntrants_(client, slug, 0, silentErrors);
}

export function Mutex() {
    var self = this; // still unsure about how "this" is captured
    var mtx = new Promise(t => t()); // fulfilled promise ≡ unlocked mutex
    this.lock = async function() {
        await mtx;
        mtx = new Promise(t => {
            self.unlock = () => t();
        });
    }
    this.unlock = () => {};
}

export async function updateEntrantsAttendanceFromSlug(client, current, slug, mutex = null){
    let entrants = await getEntrants(client, slug, false);
    if (!entrants){
        console.warn("Slug", slug, "returned nothing");
        return;
    }
    if (mutex) await mutex.lock();
    updateEntrantsAttendance(current, entrants);
    if (mutex) mutex.unlock();
}

export async function getAttendanceOverLeague(client, eventSlugs){
    let attendance = {};
    let mutex = new Mutex();

    await Promise.all(eventSlugs.map( (slug) => {
        return updateEntrantsAttendanceFromSlug(client, attendance, slug, mutex);
    }))

    return attendance
}