//TODO : USE ID INSTEAD OF TAG

export function updateEntrantAttendance(current, player, user){
    let id = player.id;
    if (current[id]){
        current[id].count++;
    } else {
        current[id] = {
            count: 1,
            player, user
        };
    }
    
}

export function updateEntrantsAttendance(current, entrantList){
    for (let e of entrantList){
        for (let p of e.participants){
            updateEntrantAttendance(current, p.player, p.user);
        }
    }
}