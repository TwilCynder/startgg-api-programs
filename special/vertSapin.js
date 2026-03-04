import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { readMultimodalArrayInput } from "./include/lib/util.js";

let {inputfile} = new ArgumentsManager()
    .addParameter("inputfile")
    .enableHelpParameter()
    .parseProcessArguments()

let data = await readMultimodalArrayInput(inputfile, null);

let players = {}

function addSet(playerID, playerName){
    if (players[playerID]){
        players[playerID].set++;
    } else {
        players[playerID] = {name: playerName, set: 1, vert: 0}
    }
}

function addVert(playerID){
    players[playerID].vert++;
}

eventsLoop:
for (const event of data){
    if (!event || !event.sets) continue;
    for (const set of event.sets){
        if (!set.slots[0].entrant.participants) continue;
        if (set.slots[0].entrant.participants.length > 1) continue eventsLoop;

        let score1 = set.slots[0].standing.stats.score.value;
        let score2 = set.slots[1].standing.stats.score.value;

        const p1 = set.slots[0].entrant.participants[0].player
        addSet(p1.id, p1.gamerTag)
        const p2 = set.slots[1].entrant.participants[0].player
        addSet(p2.id, p2.gamerTag)

        if (score1 < 0){
            addVert(p2.id);
        } else if (score2 < 0){
            addVert(p1.id);
        }
    }
}

let list = Object.values(players);
for (const p of list){
    p.avg = p.vert / p.set;
}
console.log(list.filter(player => player.set > 40).sort((a, b) => a.avg - b.avg).slice(-10))