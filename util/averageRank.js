import * as fs from 'fs';
import { readLinesAsync } from '../include/lib/readUtil.js';
import { ArgumentsManager } from '@twilcynder/arguments-parser';
import { purple, yellow } from '../include/lib/consoleUtil.js';

let {rankingsFilename, rankingSize, outputFile, tiers, trimHigh, trimlow} = new ArgumentsManager()
    .addParameter("rankingsFilename")
    .addParameter("rankingSize", {type: "number"}, true)
    .addOption("-o", {dest: "outputFile"})
    .addOption(["-t", "--tiers"], {description: "Make tiers using k-means clustering"})
    .addOption(["-H", "--trim-high"], {description: "Remove the n highest rankings for each players", dest: "trimHigh", type: "number"})
    .addOption(["-L", "--trim-low"], {description: "Remove the n low rankings for each players", dest: "trimlow", type: "number"})

    .enableHelpParameter()

    .parseProcessArguments();

var lines = await readLinesAsync(rankingsFilename);

function mean(vals){
    return vals.reduce((prev, current) => prev + current) / vals.length;
}

/**
 * @param {string} name 
 * @param {number[]} scores 
 * @returns 
 */
function player(name, scores, totalRankings){

    if (scores.length < totalRankings) scores = scores.concat(new Array(totalRankings - scores.length).fill(0));
    console.log(name, scores);

    if ((trimHigh || trimlow) && scores.length > trimHigh + trimlow){
        scores.sort((a, b) => a - b)
        if (trimHigh > 0) scores = scores.slice(0, -trimHigh)
        if (trimlow > 0) scores = scores.slice(trimlow)
        console.log("After trimming : ", scores)
    }

    let avg = mean(scores, totalRankings);
    let variance = mean(scores.map(score => (score - avg) * (score - avg)), totalRankings)
    let ecartType = Math.sqrt(variance);

    return {name, avg, variance, ecartType}
}

/**
 * @type {{[name: string]: number[]}}
 */
let players = {}

let rank = rankingSize;
let rankingsNB = 1;
for (let line of lines){
    line = line.trim();

    if (line.length < 1 || line.startsWith(" ") || line.startsWith("#")){
        if (rank != rankingSize) rankingsNB++;
        rank = rankingSize;
        continue;
    }

    const fields = line.split("/");
    const score = rank - ((fields.length - 1) / 2)
    for (let field of fields){
        const name = field.toLowerCase();

        let scores = players[name];
        if (!scores) {
            scores = [];
            players[name] = scores;
        }
        scores.push(score);

    }
    rank -= fields.length;


}

console.log(rankingsNB);

let result = Object.entries(players).map(([name, scores]) => player(name, scores, rankingsNB))
  
result = result.sort((a, b) => b.avg - a.avg);

//---- K-MEANS

function kmeans(players, k){
    console.log("Calculating k-means with", k, "clusters");

    let clusters = [];
    for (let i  = 0; i < k; i++){
        clusters.push({mean: (rankingSize / k * i) + rankingSize / (k*2), players: []})
        console.log("Cluster", i, ":", clusters[i].mean);
    }

    
    
}

if (tiers == "auto"){
    
} else if (!isNaN(tiers)){

} else {
    console.error("The value of the --tiers/-t option should be a number or \"auto\"");
}

console.log("---------------")
for (let i = 0; i < result.length; i++){
    let res = result[i]
    console.log(i + 1, res.name, yellow(res.avg.toFixed(2)), purple(res.ecartType.toFixed(2)));
}

if (outputFile){
    fs.writeFileSync(outputFile, result.map((p, i) => `${i+1}\t${p.name}\t${p.avg.toFixed(2)}\t${Math.ceil(p.ecartType * 10) / 10}`).join('\n'));
}
