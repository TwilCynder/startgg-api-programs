//things that are a bit too specific for startgg-helper

import { deep_get } from "startgg-helper-node";

export function getTeamScore(set, team){
    const slot = set.slots[team];
    return getSlotScore(slot);
}

export function getSlotScore(slot){
    return deep_get(slot, "standing.stats.score.value");
}