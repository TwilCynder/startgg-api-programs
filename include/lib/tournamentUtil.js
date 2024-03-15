const placements = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 64, 96, 128, 192, 256];

export function getDoubleEliminationPlacementTier(placement){
    for (let tier of placements){
        if (placement <= tier) return tier;
    }
}

export function getDoubleEliminationUpsetFactorFromSeeds(winnerSeed, loserSeed){
    if (winnerSeed < loserSeed) return 0;

    console.log("NON NULL SPR");

    let winnerExpectedTierID, loserExpectedTierID;

    for (let i = 0; i < placements.length; i++){
        if (winnerSeed <= placements[i]) {winnerExpectedTierID = i; break;}
    }

    for (let i = 0; i < placements.length; i++){
        if (loserSeed <= placements[i]) {
            loserExpectedTierID = i;
            break;
        } 
    }

    if (!winnerExpectedTierID || !loserExpectedTierID) return undefined;

    return (winnerExpectedTierID - loserExpectedTierID);
}

export function getDoubleEliminationUpsetFactorFromSet(set){
    let score1 = set.slots[0].standing.stats.score.value;
    let score2 = set.slots[1].standing.stats.score.value;
    let seed1 = set.slots[0].entrant.seeds.at(-1).seedNum;
    let seed2 = set.slots[1].entrant.seeds.at(-1).seedNum;

    if (score1 < 0 || score2 < 0) return [0, 0];

    console.log(set.slots[0].entrant.name, set.slots[1].entrant.name);
    console.log(score1, score2, seed1, seed2);

    return (score1 > score2) ? [getDoubleEliminationUpsetFactorFromSeeds(seed1, seed2), 0] : [getDoubleEliminationUpsetFactorFromSeeds(seed2, seed1), 1];
}

/**
 * Returns the tournament part in an event slug. Assumes the event slug is valid
 * @param {string} eventSlug 
 */
export function getTournamentSlugFromEventSlug(eventSlug){
    return eventSlug.split(/\/event/g)[0];
}