import fs from "fs";
import { client } from "./include/lib/client.js";
import { getEntrantsCountOverLeague } from "./include/getEntrantsCount.js";
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

let count = await getEntrantsCountOverLeague(client, list);

console.log(count);