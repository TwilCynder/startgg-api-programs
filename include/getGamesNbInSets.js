/**
 * 
 * @param {Object[]} sets 
 */
export function getGamesNbInSets(sets){
    let games = 0;
    for (let set of sets){
        if (set.games){
            games += set.games.length;
        }
    }
    return games;
}