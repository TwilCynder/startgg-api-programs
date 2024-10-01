import { getUserSetsChars } from "./getUserSetsChars.js";
import { getCharsStatsInSetsFiltered, PlayerUserFilter } from "./processCharacterStatsFiltered.js";

export function processMain(sets, filter, n, chars = null){
    let stats = getCharsStatsInSetsFiltered(sets, filter, false);
    let entries = Object.entries(stats);
    if (chars){
        entries = entries.filter(([key]) => !!chars[key]);
    }
    let total = entries.reduce((prev, [_, current]) => prev + current, 0);
    return entries
        .map(([key, value]) => ({id: key, count: value, percentage: value / total}))
        .sort((a, b) => b.count - a.count)
        .slice(0, n);
}

export function getUserMain(client, id, limiter, charsN, setsN, chars = null){
    let sets = getUserSetsChars(client, id, limiter, {max: setsN});
    return processMain(sets, PlayerUserFilter(id), charsN, chars);
}