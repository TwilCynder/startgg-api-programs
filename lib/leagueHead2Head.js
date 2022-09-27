import { getSetsFromPlayer } from "./getSetsPlayer.js";
import { getHead2HeadFromSets } from "./head2head.js"

async function getSetsFromPlayers(client, players){
    let setsArray = []
    await Promise.all(players.slice(0, -1).map( (player) => getSetsFromPlayer(client, player.id, 20000)))
        .then(values => setsArray = values);
    return setsArray;
}

async function getSetsFromPlayersSync(client, players){
    let setsArray = [];
    let count = 0;
    for (let player of players){
        console.log("Loading sets from player ", player.name, "with ID", player.id);
        let sets = await getSetsFromPlayer(client, player.id, 1000);
        count += sets.length
        setsArray.push(sets)
        console.log("Current sets count : ", count)
    }
    return setsArray
}

export function leagueHeadHeadToHeadFromSets(setsArray, players){
    let res = []
    for (let i = 0; i < players.length; i++){
        let line = []
        for (let j = i + 1; j < players.length; j++){
            let h2h = getHead2HeadFromSets(setsArray[i], players[i], players[j]);
            line.push(h2h);
        }
        res.push(line);
    }
    return res;
}

export async function leagueHeadToHead(client, players){
    let setsArray = await getSetsFromPlayersSync(client, players);

    return leagueHeadHeadToHeadFromSets(setsArray, players);
}