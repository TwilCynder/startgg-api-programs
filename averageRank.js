import * as fs from 'fs';

var print = console.log;

if (process.argv.length < 3 ){
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " rankingsFilename");
    process.exit()
}

var lines = fs.readFileSync(process.argv[2]).toString('utf-8').replaceAll('\r', '').split('\n');

let players = {}

let rank = 30;
for (let line of lines){

    if (line.length < 1 || line.startsWith(" ")){
        rank = 30;
        continue;
    }

    line = line.toLowerCase().trim();

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
    console.log(i, items[i][0], ":", items[i][1])
}
