import * as fs from 'fs';
import { readLines } from './include/lib/lib.js';
import { ArgumentsManager } from '@twilcynder/arguments-parser';

let {rankingsFilename, rankingSize} = new ArgumentsManager()
    .addParameter("rankingsFilename")
    .addParameter("rankingSize", {type: "number"}, true)
    .enableHelpParameter()

    .parseProcessArguments();

var lines = readLines(process.argv[2]);

let players = {}

let rank = rankingSize;
for (let line of lines){
    line = line.trim();

    if (line.length < 1 || line.startsWith(" ") || line.startsWith("#")){
        rank = 30;
        continue;
    }

    line = line.toLowerCase();

    let currentScore = (players[line] ? players[line] : 0);
    players[line] = currentScore + rank;
    console.log(rank, ":", line);

    rank--;
}

var items = Object.keys(players).map(function(key) {
    return [key, players[key]];
});
  
items.sort(function(first, second) {
    return second[1] - first[1];
});
  

console.log("---------------")
for (let i = 0; i < items.length; i++){
    console.log(i + 1, items[i][0], ":", ((30 - items[i][1] / 10) + 1).toFixed(1))
}
