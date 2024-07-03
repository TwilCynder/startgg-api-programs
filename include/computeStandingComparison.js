import { User } from "./user.js";

export class StandingComparison {
    constructor(){
        //which players are compared is implicit, based on the position of this comparison in the matrix
        this.left = 0;
        this.right = 0;
        this.draws = 0;
    }
}

export class StandingComparisonMatrix {
    /**
     * @param {User[]} users 
     */
    constructor(users){
        for (let i = 0; i < users.length; i++){
            let line = {}
            for (let j = i + 1; j < users.length; j++){
                line[users[j].id] = new StandingComparison();
            }
            this[users[i].id] = line;
        }
    }

    draw(u1, u2){
        draw(this, u1, u2);
    }

    inc(u1, u2){
        inc(this, u1, u2);
    }

    getStrict(u1, u2){
        return this[u1][u2]
    }
}

function draw(matrix, u1, u2){
    let line = matrix[u1];
    let elem = line[u2];
    if (elem){
        elem.draws++;
    } else {
        matrix[u2][u1].draws++;
    }
}

/**
 * Gives one point to u1 in their standing comparison with u2
 */
function inc(matrix, u1, u2){
    let line = matrix[u1];
    let elem = line[u2];
    if (elem){ //u1 is before u2 in the list, so u1 is the left user in the comparison
        elem.left++;
    } else {    //u1 is after u2 in the list, so u1 is the right user in the comparison
        elem = matrix[u2][u1];
        elem.right++;
    }   
}

export function getSCFromIndex(matrix, users, i1, i2){
    return matrix[users[i1].id][users[i2].id];
}

function processEvent(ev, matrix){
    if (!ev){
        console.warn("---- Null event found ! ----");
        return;
    }

    console.log("Event :", ev.id, ev.tournament.name);

    let seen = []; //players IN A HIGHER TIER
    let currentTier = [];
    let prevPlacement = 0;
    for (let standing of ev.standings.nodes){
        if (standing.placement != prevPlacement){ //new standing tier
            seen = seen.concat(currentTier);
            currentTier = [];
        }
        prevPlacement = standing.placement;

        if (!standing.entrant.participants[0].user) continue;

        let id = standing.entrant.participants[0].user.id;
        
        if (matrix[id]){
            for (let userID of currentTier){
                draw(matrix, userID, id);
            }

            for (let userID of seen){
                inc(matrix, userID, id); //for each player above in the standing, 
            }
            currentTier.push(id);
        }

    }
}

export function computeStandingComparisonFromStandings(users, events){
    let matrix = new StandingComparisonMatrix(users);

    console.log(events);

    for (let ev of events){
        processEvent(ev, matrix);
    }

    return matrix;
}