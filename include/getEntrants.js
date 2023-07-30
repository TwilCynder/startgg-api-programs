import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { relurl } from './lib/dirname.js';
import { updateEntrantsAttendance } from './entrantAttendanceUtilities.js';
import { Console } from 'console';


const schemaFilename = "./GraphQLSchemas/EventEntrants.txt";

const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

export async function getEntrants(client, slug, silentErrors = false){
    console.log("Getting entrants from event : ", slug);
    try {
        let data = await client.request(schema, {
            slug: slug
        });
        if (data && data.event){
            return data.event.entrants.nodes;
        }
        return null;
    } catch (e) {
        if (!silentErrors) console.log("/!\\ Request failed.", "Message : ", e);
        return null;
    }
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
    console.log("Lock")
    updateEntrantsAttendance(current, entrants);
    console.log("unlock");
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
