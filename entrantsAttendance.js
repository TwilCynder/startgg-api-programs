import { client } from "./lib/common.js";
import { getAttendanceOverLeague, updateEntrantsAttendanceFromSlug } from "./lib/getEntrants.js";


if (process.argv.length < 3 ){
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " {-f listFilename | -s template min max | slugs ...} ");
    process.exit()
}

let lsit = [];
switch (process.argv[2]){
    case '-f':
        console.log("-f is not suported yet sorryyyyy");
        process.exit(1);
    case '-s':
        {
            if (process.argv.length < 3 ){
                console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " {-f listFilename | -s template min max | slugs ...} ");
                process.exit()
            }
            let template = process.argv[4];
            let min = parseInt(process.argv[5]);
            let max = parseInt(process.argv[6]);

            for (let i = min; i <= max; i++){
                
            }
        }
}

getAttendanceOverLeague(client, ["tournament/stock-o-clock-43/event/1v1-ultimate", "tournament/stock-o-clock-42/event/1v1-ultimate"]);