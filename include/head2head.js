import { User } from "./user.js";

export class Head2Head extends Array {
    /**
     * @param {User} p1 
     * @param {User} p2 
     */
    constructor(p1, p2){
        super()
        this[0] = {user : p1, score: 0};
        this[1] = {user : p2, score: 0};
    }

    addResult(user){
        this[user].score++;
    }

    toString(){
        return "" + this[0].user.name + " " + this[0].score + " - " + this[1].score + " " + this[1].user.name;
    }

    getScore(){
        return "" + this[0].score + " - " + this[1].score;
    }
}

/**
 * Assumes all the sets feature at least one of the players
 * @param {{}[]} p1Sets 
 * @param {User} p1 
 * @param {User} p2 
 * @returns 
 */
export function getHead2HeadFromConfirmedSet(p1Sets, p1, p2){
    let result = new Head2Head(p1, p2);

    p1Sets.forEach(set => {
        if (!set.slots[0].entrant || !set.slots[1].entrant) return;
        let setP1 = set.slots[0].entrant.participants;

        if (setP1.length > 1) {
            //console.log("[Ignoring non-1v1 set]");
            return;
        }
        setP1 = setP1[0].user;

        let p1PositionInSet = (p1.id == setP1.id) ? 0 : 1;
        try {
            let otherPlayer = set.slots[1 - p1PositionInSet].entrant.participants[0].user;
    
            if (otherPlayer.id == p2.id){
                //match found
                let p1result = set.slots[p1PositionInSet].standing.placement
                result.addResult(p1result == 1 ? 0 : 1)
                //console.log("Winner : " + ((p1result == 1) ? p1.name : p2.name))
            }
        } catch (e){
            console.error("Error while parsing sets : ", e);
        }

    });

    return result
}