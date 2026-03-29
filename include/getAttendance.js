import { updateEntrantsAttendance } from './entrantAttendanceUtilities.js';

/**
 * @param {{}[]} events 
 */
export function getAttendanceFromEvents(events, usersOnly){
    let attendance = {}
    events.map(eventEntrants => {
        updateEntrantsAttendance(attendance, eventEntrants.slug ? eventEntrants.entrants : eventEntrants, usersOnly);
    })
    return attendance;
}

export function getSortedAttendanceFromEvents(events, usersOnly){
    let attendance = getAttendanceFromEvents(events, usersOnly);

    let list = Object.entries(attendance).map(([id, data]) => {
        return Object.assign({id}, data);
    })
    list.sort( (a, b) => b.count - a.count);

    return list;
}
