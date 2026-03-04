import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { readMultimodalArrayInput } from "./include/lib/util.js";

let {inputfile} = new ArgumentsManager()
    .addParameter("inputfile")
    .enableHelpParameter()
    .parseProcessArguments()

let events = await readMultimodalArrayInput(inputfile, null);

let players = {}
eventsLoop:
for (const event of events){
    if (!event || !event.standings) continue;
    for (const standing of event.standings.nodes){
        const entrant = standing.entrant;
        if (!entrant) continue;

        const participants = entrant.participants;
        if (!participants) continue;

        if (participants.length > 1){
            console.log("Skipping non-1v1 event :", event.slug);
            continue eventsLoop;
        }

        const player = participants[0].player;
        const placement = standing.placement;

        if (players[player.id]){
            players[player.id].nb++
        } else {
            players[player.id] = {name: player.gamerTag, neuf: 0, top8: 0, nb: 1}
        }

        if (placement == 9){
            players[player.id].neuf++;
        } else if (placement <= 8){
            players[player.id].top8++;
        }
    }
}

let list = Object.values(players);
for (const p of list){
    p.avg = p.neuf / p.nb;
}
console.log(list.filter(player => player.top8 < 2 && player.nb > 10 && player.neuf > 4).sort((a, b) => a.avg - b.avg).slice(-10))