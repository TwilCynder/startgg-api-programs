import * as fs from 'fs';
import { readLines } from '../include/lib/jsUtil.js';
import { ArgumentsManager } from '@twilcynder/arguments-parser';

let {rankingsFilename, rankingSize, outputFile} = new ArgumentsManager()
    .addParameter("rankingsFilename")
    .addParameter("rankingSize", {type: "number"}, true)
    .addOption("-o", {dest: "outputFile"})
    .enableHelpParameter()

    .parseProcessArguments();

var lines = readLines(rankingsFilename);

function mean(vals){
    return vals.reduce((prev, current) => prev + current) / vals.length
}

/**
 * @param {string} name 
 * @param {number[]} scores 
 * @returns 
 */
function player(name, scores){
    console.log(name, scores);

    let avg = mean(scores);
    let variance = mean(scores.map(score => (score - avg) * (score - avg)))
    let ecartType = Math.sqrt(variance);

    return {name, avg, variance, ecartType}
}

/**
 * @type {{[name: string]: number[]}}
 */
let players = {}

let rank = rankingSize;
for (let line of lines){
    line = line.trim();

    if (line.length < 1 || line.startsWith(" ") || line.startsWith("#")){
        rank = rankingSize;
        continue;
    }

    line = line.toLowerCase();

    let scores = players[line];
    if (!scores) {
        scores = [];
        players[line] = scores;
    }
    scores.push(rank);

    rank--;
}

let result = Object.entries(players).map(([name, scores]) => player(name, scores))
  
result = result.sort((a, b) => b.avg - a.avg);

console.log("---------------")
for (let i = 0; i < result.length; i++){
    let res = result[i]
    console.log(i + 1, res.name, res.avg.toFixed(2), res.ecartType.toFixed(2));
}

if (outputFile){
    fs.writeFileSync(outputFile, result.map((p, i) => `${i+1}\t${p.name}\t${p.avg.toFixed(2)}\t${Math.ceil(p.ecartType * 10) / 10}`).join('\n'));
}
