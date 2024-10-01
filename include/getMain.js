import { getCharsStatsInSetsFiltered } from "./processCharacterStatsFiltered.js";

export function processMain(sets, filter, n){
    let stats = getCharsStatsInSetsFiltered(sets, filter, false);
    console.log(stats);
}