import { deep_get } from "./lib/lib.js";

function updateCharsGamesCount(chars, set){
    if (!set.games) return chars;
    for (let game of set.games){
        if (!game.selections) continue;
        for (let selection of game.selections){
            let char = selection.selectionValue;
            if (!(typeof char == "number")) continue; //REMOVE ONE DAY WHEN WE HANDLE TEAMS 

            if (!chars[char]) chars[char] = 0;
            chars[char]++;
        }
    }
    return chars;
}

function updateCharsGamesSetsCount(chars, set){
    if (!set.games) return chars;
    let seenChars = [];
    for (let game of set.games){
        if (!game.selections) continue;
        for (let selection of game.selections){
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
    }
    return chars;
}

function updateCharsGamesCountPlayers(chars, set){
    if (!set.games) return chars;
    for (let game of set.games){
        if (!game.selections) continue;
        //for (let selection of game.selections){
		for (let i = 0; i < set.slots.length; i++){
			let slot = set.slots[i];
			let selection = game.selections[i];

            if (!selection) continue;

            let char = selection.selectionValue;

            if (!(typeof char == "number")) continue; //REMOVE ONE DAY WHEN WE HANDLE TEAMS 

            let charObj = chars[char];
            if (!charObj){
                charObj = {games: 0, players: {}};
                chars[char] = charObj;
            }
			charObj.games++;

			let participants = deep_get(slot, "entrant.participants");
			if (!participants || !participants[0]) continue;
			for (let participant of participants){
				let player = participant.player;
				if (!player) continue;
				let playerObj = charObj.players[player.id];
				if (!playerObj){
					playerObj = {id: player.id, name: player.gamerTag, games: 0};
					charObj.players[player.id] = playerObj;
				}
				playerObj.games++;
			}

        }
    }
    return chars;
}

function updateCharsGamesSetsCountPlayers(chars, set){
    if (!set.games) return chars;
    let seenCharsSet = [];
    for (let slotIndex = 0; slotIndex < set.slots.length; slotIndex++){
        let slot = set.slots[slotIndex];

        let participants = deep_get(slot, "entrant.participants");
        if (!participants || !participants[0]) continue;
        let participant = participants[0];

        let seenCharsPlayer = [];

        for (let game of set.games){
            if (!game.selections) continue;
            let selection = game.selections[slotIndex];

            if (!selection) continue;

            let char = selection.selectionValue;

            if (!(typeof char == "number")) continue; //REMOVE ONE DAY WHEN WE HANDLE TEAMS 

            let charObj = chars[char];
            if (!charObj){
                charObj = {games: 0, sets: 0, players: {}};
                chars[char] = charObj;
            }
            charObj.games++;

            if (!seenCharsSet.includes(char)){
                seenCharsSet.push(char);
                charObj.sets++;
            }

            let player = participant.player;
            if (!player) continue;
            let playerObj = charObj.players[player.id];
            if (!playerObj){
                playerObj = {id: player.id, name: player.gamerTag, games: 0, sets: 0};
                charObj.players[player.id] = playerObj;
            }
            playerObj.games++;

            if (!seenCharsPlayer.includes(char)){
                seenCharsPlayer.push(char);
                playerObj.sets++;
            }
        }
    }

    return chars;
}

/**
 * Returns the update function that matches the requirements described by the arguments
 * @param {boolean} sets true for an update function that processes sets
 * @param {boolean} players true for an update function that processes individual player stats
 */
export function getUpdateFunction(sets, players){
	return sets ?
		(players ? updateCharsGamesSetsCountPlayers : updateCharsGamesSetsCount) :
		(players ? updateCharsGamesCountPlayers : updateCharsGamesCount)
}

export function processSets(chars, sets, updateFunction = updateCharsGamesCount){
    for (let set of sets){
        if (!set.games) continue;
        updateFunction(chars, set);
    }
    return chars;
}

export function getCharsStatsInSets(sets, updateFunction){
    return processSets({}, sets, updateFunction);
}