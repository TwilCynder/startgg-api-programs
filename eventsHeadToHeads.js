import fs from "fs";
import { client } from "./include/lib/common.js";
import { computeEventList } from "./include/lib/computeEventList.js";
import { getSetsInEvent } from "./include/eventsSets.js";

console.log((await getSetsInEvent(client, "tournament/stock-o-clock-51/event/1v1-ultimate")).length);

/*
let list = computeEventList(process.argv.slice(2))
if (!list) {
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " [-m min_attendance] {-f listFilename | -s template min max | slugs ...} ");
    process.exit();
}

*/