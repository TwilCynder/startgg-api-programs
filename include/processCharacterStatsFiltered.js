import { deep_get } from "./lib/jsUtil.js";

export class PlayerUserFilter {
    constructor(userID, playerID){
        this.userID = userID;
        this.playerID = playerID;
    }

    apply(participant){
        return participant && 
            this.userID ? (participant.user && participant.user.id == this.userID) : 
            this.playerID ? (participant.player && participant.player.id == this.playerID) : 
            true
    }

    static apply(filter, participant){
        return filter && filter.apply(participant);
    }
}

function updateCharsGamesCountFiltered(chars, set, filter){
    if (!set.games) return chars;
    let I = null;
    for (let i = 0; i < set.slots.length; i++){
        let slot = set.slots[i];
        let participant = slot.entrant.participants[0];
        if (PlayerUserFilter.apply(filter, participant)){
            I = i;
        }
    }
    if (I == null) return chars;
    for (let game of set.games){
        if (!game.selections) continue;
        let selection = game.selections[I];
        if (!selection) continue;
        console.log("Selection found", I);
        let char = selection.selectionValue;
        console.log(char)
        if (!(typeof char == "number")) continue; //REMOVE ONE DAY WHEN WE HANDLE TEAMS 

        if (!chars[char]) chars[char] = 0;
        chars[char]++;
        
    }
    return chars;
}

function updateCharsGamesSetsCountFiltered(chars, set, filter){
    if (!set.games) return chars;
    let seenChars = [];
    let I = null;
    for (let i = 0; i < set.slots.length; i++){
        let slot = set.slots[i];
        let participant = slot.entrant.participants[0];
        if (PlayerUserFilter.apply(filter, participant)){
            I = i;
        }
    }
    if (I == null) return chars;
    for (let game of set.games){
        if (!game.selections) continue;
        let selection = game.selections[I];
        if (!selection) continue;
        let char = selection.selectionValue;
        if (!(typeof char == "number")) continue; //REMOVE ONE DAY WHEN WE HANDLE TEAMS 

        let charObj = chars[char];
        if (!charObj){
            charObj = {games: 0, sets: 0};
            chars[char] = charObj;
        }

        if (!seenChars.includes(char)){
            seenChars.push(char);
            charObj.sets++;
        }
        charObj.games++;
        
    }
    return chars;
}

function getUpdateFunction(setStats){
    return setStats ? updateCharsGamesSetsCountFiltered : updateCharsGamesCountFiltered;    
}

export function processSetsFiltered(chars, sets, filter, setStats = false){
    for (let set of sets){
        if (!set.games) continue;
        getUpdateFunction(setStats)(chars, set, filter);
    }
    return chars;
}

export function getCharsStatsInSetsFiltered(sets, filter, setStats = false){
    return processSetsFiltered({}, sets, filter, setStats);
}