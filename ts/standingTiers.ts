function min(a: number, b:number){
    return a < b ? a : b;
}

function placementToTier(placement:number){
    
}

export function standingTiers(data: string[]){
    let result:string[][] = [];
    
    let i = 0;

    for (; i < min(data.length, 4); i++){
        result.push([data[i]]);
    }

    if (data.length <= 4) return result;

    let tierSize
}