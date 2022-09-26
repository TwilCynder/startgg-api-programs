import { getSetsFromPlayer } from "./getSetsPlayer.js";
import { getHead2HeadFromSets } from "./head2head.js"

async function getSetsFromPlayers(client, players){
    let setsArray = []
    await Promise.all(players.slice(0, -1).map( (player) => getSetsFromPlayer(client, player.id)))
        .then(values => setsArray = values);
    return setsArray;
}

export function leagueHeadHeadToHeadFromSets(setsArray, players){
    for (let i = 0; i < players.length; i++){
        for (let j = i + 1; j < players.length; j++){
            let h2h = getHead2HeadFromSets(setsArray[i], players[i], players[j]);
            console.log(h2h.toString());
        }
    }
}

export async function leagueHeadToHead(client, players){
    let setsArray = await getSetsFromPlayers(client, players);

    leagueHeadHeadToHeadFromSets(setsArray, players);
}