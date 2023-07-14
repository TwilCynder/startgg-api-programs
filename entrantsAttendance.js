import { createWriteStream } from "fs";
import { client } from "./include/lib/common.js";
import { getAttendanceOverLeague } from "./include/getEntrants.js";

if (process.argv.length < 3 ){
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " [-m min_attendance] {-f listFilename | -s template min max | slugs ...} ");
    process.exit()
}

let argIndex = 2;
let list = [];
let printList = false;

while(argIndex < process.argv.length){
    switch (process.argv[argIndex]){
        case "-f":
            console.log("-f is not suported yet sorryyyyy");
            process.exit(1);
        case "-s":
            {
                if (process.argv.length < 3 ){
                    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " {-f listFilename | -s template min max | slugs ...} ");
                    process.exit()
                }
                let template = process.argv[argIndex + 1];
                let min = parseInt(process.argv[argIndex + 2]);
                let max = parseInt(process.argv[argIndex + 3]);
                console.log(template, min, max)
                for (let i = min; i <= max; i++){
                    list.push(template.replace("%", i));
                }
                argIndex += 3;
            }
            break;
        case "-l":  
            printList = true;
        default:
            list.push(process.argv[argIndex]);
    }

    argIndex++;
}


let attendance = await getAttendanceOverLeague(client, list);
let entrantsList = []

for (let entrant in attendance) {
    entrantsList.push({name: entrant, attendance: attendance[entrant]});
}
entrantsList.sort((a, b) => a.attendance - b.attendance);

let pools = {};
let t = 1;
let count = 0;
for (let e of entrantsList){
    if (e.attendance > t){
        if (count > 0) pools[t] = count;
        count = 0;
        t = e.attendance;
    }
    count++;
    console.log(e.name, e.attendance);
}
pools[t] = count;

let file = createWriteStream("out.txt", {encoding: "utf-8"});

let cumulative = 0;
for (let i = list.length; i > 0; i--){
    if (!pools[i]) continue;
    cumulative += pools[i];
    console.log(i, "tournaments :", pools[i], '\t', "total :", cumulative);
    file.write(i + '\t' + cumulative + '\t' + pools[i] + '\n');
}

console.log(entrantsList.length)