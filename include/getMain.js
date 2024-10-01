import { getCharsStatsInSetsFiltered } from "./processCharacterStatsFiltered.js";

export function processMain(sets, filter, n, chars = null){
    let stats = getCharsStatsInSetsFiltered(sets, filter, false);
    let entries = Object.entries(stats);
    if (chars){
        entries = entries.filter(([key]) => !!chars[key]);
    }
    return entries
        .map(([key, value]) => ({id: key, count: value}))
        .sort((a, b) => b.count - a.count)
        .slice(0, n);
}