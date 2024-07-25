import { deep_get } from "./lib/lib.js";

function updateCharsGamesCount(chars, set){
    for (let game of set.games){
        if (!game.selections) continue;
        for (let selection of game.selections){
            let char = selection.selectionValue;

            if (!chars[char]) chars[char] = 0;
            chars[char]++;
        }
    }
    return chars;
}

function updateCharsGamesSetsCount(chars, set){
    let seenChars = [];
    for (let game of set.games){
        if (!game.selections) continue;
        for (let selection of game.selections){
            let char = selection.selectionValue;

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
    for (let game of set.games){
        if (!game.selections) continue;
        //for (let selection of game.selections){
		for (let i = 0; i < set.slots.length; i++){
			let slot = set.slots[i];
			let selection = game.selections[i];

            if (!selection) continue;

            let char = selection.selectionValue;

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