import { getPlayersLastStandings } from "./include/getLastStandings.js";
import { client } from "./include/lib/client.js";
import * as fs from 'fs';

if (process.argv.length < 3 ){
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " IDsListFilename");
    process.exit()
}

var IDs = fs.readFileSync(process.argv[2]).toString('utf-8').replaceAll('\r', '').split('\n');

let placementPoints = {
    999999 : 0,
    65: 5,
    49: 7,
    33: 9,
    25: 11,
    17: 13,
    13: 15,
    9: 16,
    7: 17,
    5: 18,
    4: 19,
    3: 20,
    2: 21,
    1: 22
}

function getSPRPoints(predicted, real){
    let oneSPRValue = 2;
    let SPRPts = -1;
    for (let p in placementPoints){
        if (p == 9){
            oneSPRValue = 3;
        }

        if (p - 1 >= predicted) {
            return SPRPts == 0 ? 1 : (SPRPts < 0 ? 0 : SPRPts);
        }
        if (SPRPts >= 0){
            SPRPts += oneSPRValue;
        }
        if (p == real) {
            SPRPts = 0; 
        }
    }
}

function processStanding(standing){
    let spr = getSPRPoints(standing.entrant.initialSeedNum, standing.placement)
    console.log(placementPoints[standing.placement]);
    return spr + placementPoints[standing.placement];
}

function processStandings(standings){
    let eventsCounted = 0;
    let total = 0;

    let results = []

    for (let s of standings){
        let slug = s.entrant.event.slug;
        console.log(slug);
        if (slug.includes("stock-o-clock") && slug.includes("1v1")){
            results.push(processStanding(s))
            eventsCounted++;
            if (eventsCounted >= 6) {
                break;
            };
        }
    }

    results.sort((a, b) => b - a);
    console.log(results, results.slice(0, 3));
    results = results.slice(0, 3)
    for (let res of results){
        total += res;
    }

    return total / results.length;
}

function processPlayers(users){
    let res = ""
    console.log("Processing users");
    for (let u of users){
        if (u && u.user){
            console.log(u.user.player.gamerTag)
            //console.log(processStandings(u.user.player.recentStandings))
            res += u.user.player.gamerTag + "\t" + processStandings(u.user.player.recentStandings).toFixed(2).replaceAll(".", ",") + "\n";
        }
    }
    return res;
}

var users = await getPlayersLastStandings(client, IDs);
console.log(users.length);

let res = processPlayers(users);

console.log(res);

fs.mkdir('out', () => {});
fs.writeFileSync('./out/recentstandings.txt', res, (err) => {
    console.error(err);
})