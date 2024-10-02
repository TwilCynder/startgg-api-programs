import { getEntrantsBasic } from "./getEntrantsBasic.js"
import { updateEntrantsAttendance } from './entrantAttendanceUtilities.js';

/*
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
    */

/**
 * @param {{}[]} events 
 */
export function getAttendanceFromEvents(events){
    let attendance = {}
    events.map(eventEntrants => {
        updateEntrantsAttendance(attendance, eventEntrants.entrants ? eventEntrants.entrants : eventEntrants);
    })
    return attendance;
}

export function getSortedAttendanceFromEvents(events){
    let attendance = getAttendanceFromEvents(events);

    let list = [];
    for (let id in attendance){
        list.push({id, name: attendance[id].name, count: attendance[id].count});
    }

    list.sort( (a, b) => b.count - a.count);

    return list;
}

/*
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
    */
