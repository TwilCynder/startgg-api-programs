import fs from "fs";
import { client } from "./include/lib/common.js";
import { getAttendanceOverLeague } from "./include/getEntrants.js";
import { computeEventList } from "./include/lib/computeEventList.js";

if (process.argv.length < 3 ){
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " [-m min_attendance] {-f listFilename | -s template min max | slugs ...} ");
    process.exit();
}


let list = computeEventList(process.argv.slice(2))
if (!list) {
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " [-m min_attendance] {-f listFilename | -s template min max | slugs ...} ");
    process.exit();
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

fs.mkdir('out', () => {});
let file = fs.createWriteStream("out/attendance.txt", {encoding: "utf-8"});

let cumulative = 0;
for (let i = list.length; i > 0; i--){
    if (!pools[i]) continue;
    cumulative += pools[i];
    console.log(i, "tournaments :", pools[i], '\t', "total :", cumulative);
    file.write(i + '\t' + cumulative + '\t' + pools[i] + '\n');
}

console.log(entrantsList.length)