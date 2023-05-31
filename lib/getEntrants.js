import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { relurl } from './dirname.js';
import { updateEntrantsAttendance } from './entrantAttendanceUtilities.js';


const schemaFilename = "./EventEntrants.txt";

const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

export async function getEntrants(client, slug){
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
        console.log("/!\\ Request failed, retrying.", "Message : ", e);
        return getEntrants(client, slug);
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
    let entrants = await getEntrants(client, slug);
    if (!entrants){
        throw "API returned nothing : the slug is probably incorrect";
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

    console.log(attendance);
}
