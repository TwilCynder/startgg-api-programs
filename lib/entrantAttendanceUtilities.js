export function updateEntrantAttendance(current, entrantName){
    if (current[entrantName]){
        current[entrantName]++;
    } else {
        current[entrantName] = 1;
    }
    
}

export function updateEntrantsAttendance(current, entrantList){
    for (let e of entrantList){
        updateEntrantAttendance(current, e.name);
    }
}