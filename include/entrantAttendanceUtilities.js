//TODO : USE ID INSTEAD OF TAG

export function updateEntrantAttendance(current, id, name){
    if (current[id]){
        current[id].count++;
    } else {
        current[id] = {
            count: 1,
            name
        };
    }
    
}

export function updateEntrantsAttendance(current, entrantList){
    for (let e of entrantList){
        for (let p of e.participants){
            updateEntrantAttendance(current, p.player.id, p.player.gamerTag);
        }
    }
}