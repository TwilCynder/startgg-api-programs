import { getSetsFromPlayer } from "./getSetsPlayer.js";

export class Head2Head extends Array {
    constructor(p1, p2){
        super()
        this[0] = {player : p1, score: 0};
        this[1] = {player : p2, score: 0};
    }

    addResult(player){
        this[player].score++;
    }

    toString(){
        return "" + this[0].player.name + " " + this[0].score + " - " + this[1].score + " " + this[1].player.name;
    }

    getScore(){
        return "" + this[0].player.score + " - " + this[1].player.score;
    }
}

export function getHead2HeadFromSets(p1Sets, p1, p2){
    let result = new Head2Head(p1, p2);

    p1Sets.forEach(set => {
        let setP1 = set.slots[0].entrant.participants;
        if (setP1.length > 1) {
            //console.log("[Ignoring non-1v1 set]");
            return;
        }
        setP1 = setP1[0].player;
    
        let p1PositionInSet = (p1.id == setP1.id) ? 0 : 1;
        let otherPlayer = set.slots[1 - p1PositionInSet].entrant.participants[0].player;
    
        if (otherPlayer.id == p2.id){
            //match found
            let p1result = set.slots[p1PositionInSet].standing.placement
            result.addResult(p1result == 1 ? 0 : 1)
            //console.log("Winner : " + ((p1result == 1) ? p1.name : p2.name))
        }
    });

    return result
}

export async function getHead2Head(client, p1, p2){
    return getHead2HeadFromSets(await getSetsFromPlayer(client, p1.id), p1, p2);
}