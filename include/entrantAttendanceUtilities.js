export function updateEntrantAttendance(current, player, user){
    let id = player.id;
    if (current[id]){
        current[id].count++;
    } else {
        user.player = player;
        current[id] = {
            count: 1,
            user
        };
    }
    
}

export function updateEntrantsAttendance(current, entrantList, usersOnly){
    if (!entrantList) return;
    for (let e of entrantList){
        for (let p of e.participants){
            if (!p.user){
                if (usersOnly){
                    continue;
                } else {
                    console.warn("Entrant", e.id, `(${e.name})`, "doesn't have a user account associated.");
                    p.user = {};
                }
            }
            updateEntrantAttendance(current, p.player, p.user);
        }
    }
}