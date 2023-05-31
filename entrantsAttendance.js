import { client } from "./lib/common.js";
import { getAttendanceOverLeague, updateEntrantsAttendanceFromSlug } from "./lib/getEntrants.js";


if (process.argv.length < 3 ){
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " {-f listFilename | -s template min max | slugs ...} ");
    process.exit()
}

let list = [];
switch (process.argv[2]){
    case "-f":
        console.log("-f is not suported yet sorryyyyy");
        process.exit(1);
    case "-s":
        {
            if (process.argv.length < 3 ){
                console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " {-f listFilename | -s template min max | slugs ...} ");
                process.exit()
            }
            let template = process.argv[3];
            let min = parseInt(process.argv[4]);
            let max = parseInt(process.argv[5]);
            console.log(template, min, max)
            for (let i = min; i <= max; i++){
                list.push(template.replace("%", i));
            }
            list = list.concat(process.argv.slice(6));
        }
        break;
    default:
        list = process.argv.slice(2);
}

let attendance = await getAttendanceOverLeague(client, list);
let entrantsList = []

for (let entrant in attendance) {
    entrantsList.push({name: entrant, attendance: attendance[entrant]});
}
entrantsList.sort((a, b) => a.attendance - b.attendance);

for (let e of entrantsList){
    console.log(e);
}

console.log(entrantsList.length)