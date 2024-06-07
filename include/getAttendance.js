import { getEntrants } from "./getEntrants.js";
import { updateEntrantsAttendance } from './entrantAttendanceUtilities.js';

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