import { readFileSync } from 'fs';
import { relurl } from './lib/dirname.js';
import { updateEntrantsAttendance } from './entrantAttendanceUtilities.js';
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

export async function getEntrants(client, slug, limiter, silentErrors = false){
    let data = await query.execute(client, {slug}, limiter, silentErrors);
    console.log("Fetched entrans for slug", slug);
    if (!data.event) return null;

    return data.event.entrants.nodes;
    //return getEntrants_(client, slug, 0, limiter, silentErrors);
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

export async function updateEntrantsAttendanceFromSlug(client, current, slug, mutex = null, limiter = null){
    let entrants = await getEntrants(client, slug, limiter, false);
    if (!entrants){
        console.warn("Slug", slug, "returned nothing");
        return;
    }
    if (mutex) await mutex.lock();
    updateEntrantsAttendance(current, entrants, slug);
    if (mutex) mutex.unlock();
}

export async function getAttendanceOverLeague(client, eventSlugs, limiter){
    let attendance = {};
    let mutex = new Mutex();

    await Promise.all(eventSlugs.map( (slug) => {
        return updateEntrantsAttendanceFromSlug(client, attendance, slug, mutex, limiter);
    }))

    return attendance
}

export async function getSortedAttendanceOverLeague(client, eventSlugs, limiter){
    let attendance = await getAttendanceOverLeague(client, eventSlugs, limiter);

    let list = [];
    for (let id in attendance){
        list.push({id, name: attendance[id].name, count: attendance[id].count});
    }

    list.sort( (a, b) => b.count - a.count);

    return list;
}