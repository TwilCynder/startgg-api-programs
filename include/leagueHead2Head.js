import { Head2Head, getHead2HeadFromConfirmedSet } from "./head2head.js"
import { deep_get } from "startgg-helper-node";
import { User } from "./user.js";

/**
 * @param {Head2Head[][]} mat 
 * @param {number} i 
 * @param {number} j 
 * @returns 
 */
function findCellInSymMatrix(mat, i, j){
    return i < j ? [mat[i][j - i - 1], 0] : [mat[j][i - j - 1], 1];
}

/**
 * @param {{}[]} sets 
 * @param {User[]} users 
 */
export function leagueHeadHeadToHeadFromSetsArray(sets, users){
    /** @type {Head2Head[][]} */
    let res = [];
    for (let i = 0; i < users.length; i++){
        /** @type {Head2Head[]} */
        let line = []
        for (let j = i + 1; j < users.length; j++){
            let h2h = new Head2Head(users[i], users[j]);
            line.push(h2h);
        }
        res.push(line);
    }

    for (let set of sets){
        if (!set.slots[0].entrant || !set.slots[1].entrant) continue;

        let setP1 = set.slots[0].entrant.participants;
        if (setP1.length > 1) { //it's 2v2 or smth
            //console.log("[Ignoring non-1v1 set]");
            continue;
        }
        setP1 = setP1[0].user;
        if (!setP1){ //p1 doesn't have a user account
            continue;
        }

        let setP2 = deep_get(set, "slots.1.entrant.participants.0.user")
        if (!setP2){ //p2 doesn't have a user account
            continue;
        }

        for (let [i1, user1] of users.entries()){
            if (user1.id == setP1.id){
                
                for (let [i2, user2] of users.entries()){
                    if (user2.id == setP2.id){ //found a match between user1 and user2

                        let [h2h, inverted] = findCellInSymMatrix(res, i1, i2);

                        //console.log(user1.name, user2.name, h2h[0].user.name, h2h[1].user.name, inverted, user1.name == (inverted ? h2h[1].user.name : h2h[0].user.name))
                        //console.log(set.slots[0].standing.placement, set.fullRoundText);
                        //console.log(inverted ^ (set.slots[0].standing.placement - 1), h2h[inverted ^ (set.slots[0].standing.placement - 1)].user.name);

                        h2h.addResult(inverted ^ (set.slots[0].standing.placement - 1));

                        break;
                    }
                }
                break;
            }
        }

    }

    return res;
}

export function leagueHeadHeadToHeadFromSetsMatrix(setsMat, users){
    let res = []
    for (let i = 0; i < users.length; i++){
        let line = []
        for (let j = i + 1; j < users.length; j++){
            let h2h = getHead2HeadFromConfirmedSet(setsMat[i], users[i], users[j]);
            line.push(h2h);
        }
        res.push(line);
    }
    return res;
}