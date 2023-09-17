import fs from "fs";
import { client } from "./include/lib/common.js";
import { test } from "./include/getBigHeadToHeads.js";
import { computeEventList } from "./include/lib/computeEventList.js";

let list = computeEventList(process.argv.slice(2))
if (!list) {
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " [-m min_attendance] {-f listFilename | -s template min max | slugs ...} ");
    process.exit();
}

let result = await test(client, list);
console.log(result);