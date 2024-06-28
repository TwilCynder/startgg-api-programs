import { getUsersSets } from "./getSetsUser.js";
import { getHead2HeadFromSets } from "./head2head.js"

function getSetsFromUsers(client, slugs, limiter, after, until){
    return getUsersSets(client, slugs.slice(0, -1), limiter, after, until);
}

export function leagueHeadHeadToHeadFromSets(setsArray, users){
    let res = []
    for (let i = 0; i < users.length; i++){
        let line = []
        for (let j = i + 1; j < users.length; j++){
            let h2h = getHead2HeadFromSets(setsArray[i], users[i], users[j]);
            line.push(h2h);
        }
        res.push(line);
    }
    return res;
}

export async function leagueHeadToHead(client, users, limiter, after = null, until = null){
    let setsArray = await getSetsFromUsers(client, users, limiter, after, until);

    return leagueHeadHeadToHeadFromSets(setsArray, users);
}