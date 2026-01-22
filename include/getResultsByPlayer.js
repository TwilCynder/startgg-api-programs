import { deep_get } from "startgg-helper-node";
import { excludeProperties } from "./lib/util.js";

function getEventName(event){
    return event.tournament.name + " - " + event.name;
}

function getPlayer(standing){
    const participants = standing.entrant.participants;
    if (participants.length > 1){
        return false;
    } else if (participants.length != 1) {
        return null;
    }

    const player = deep_get(participants, "0.player");
    return player;
}

function mapToArray(players){
    return Object.entries(players).map(([id, player]) => player);
}

function pushStanding(playersMap, player, standingObject){
    if (playersMap[player.id]){
        playersMap[player.id].standings.push(standingObject);
    } else {
        playersMap[player.id] = {name: player.gamerTag, standings: [standingObject], id: player.id};
    }
}

/**
 * Returns event results sorted by player i.e. a map of players with their results taken from an input array of events with their standings
 * @param {Object[]} events 
 */
export function getResultsByPlayerInline(events){
    let res = {};

    eventsLoop: for (const event of events){
        const eventName = getEventName(event);
        for (const standing of event.standings.nodes){

            const player = getPlayer(standing);
            if (player === false){
                console.log("Skipping non-singles event :", eventName);
                continue eventsLoop;
            } else if (player === null){
                console.log("Skipping empty entrant", standing.entrant.name, "at", eventName);
                continue;
            }
            const standingObject = {placement: standing.placement, eventName};

            pushStanding(res, player, standingObject);
        }
    }

    return mapToArray(res);
}

export function getResultsByPlayer(events){
    let res = {};
    let eventsMap = {};

    eventsLoop: for (const event of events){
        eventsMap[event.id] = excludeProperties(event, "standings");
        for (const standing of event.standings.nodes){
            const player = getPlayer(standing);
            if (player === false){
                console.log("Skipping non-singles event :", getEventName(event));
                continue eventsLoop;
            } else if (player === null){
                console.log("Skipping empty entrant", standing.entrant.name, "at", getEventName(event));
                continue;
            }
            const standingObject = {placement: standing.placement, eventID: event.id};
            pushStanding(res, player, standingObject);
            
        }
    }

    return {events: eventsMap, players: mapToArray(res)}
}

/*
let eventObject = {
            name: event.tournament.name + " - " + event.name,
            numEntrants: event.standings.nodes.length,
        }
            */