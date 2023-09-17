//TODO : USE ID INSTEAD OF TAG

export function updateEntrantAttendance(current, entrantName){
    if (current[entrantName]){
        current[entrantName]++;
    } else {
        current[entrantName] = 1;
    }
    
}

export function updateEntrantsAttendance(current, entrantList){
    for (let e of entrantList){
        for (let p of e.participants){
            updateEntrantAttendance(current, p.player.gamerTag);
        }
    }
}