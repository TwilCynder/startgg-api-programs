"use strict";
export const __esModule = true;
function standingTiers(data) {
    let result = [[data[0]], [data[1]]];
    let i = 2;
    let nextLimit = 2;
    let currentTierSize = 1 / 2;
    let upperTier = false;
    let currentTier = null;

    for (i; i < data.length; i++){
        if (i == nextLimit){
            currentTier = [];
            result.push(currentTier);
            if (!upperTier){
                currentTierSize *= 2;
            }
            upperTier = !upperTier
            nextLimit += currentTierSize;
        }
        currentTier.push(data[i]);
    }
    return result;
}

export const tierNames = [
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5-6",
    "7-8",
    "9-12",
    "13-16",
    "17-24",
    "25-32",
    "33-48",
    "49-64",
    "65-96",
    "97-128",
    "129-192",
    "193-256",
]

export { standingTiers as standingTiers };