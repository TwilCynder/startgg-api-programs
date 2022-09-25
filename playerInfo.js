import { client } from "./lib/common.js";
import { getPlayerInfo } from "./lib/getPlayerInfo.js";

if (process.argv.length < 3 ){
    console.log("Need one argument");
    process.exit()
}

let slug = process.argv[2]

console.log(slug)

let player = await getPlayerInfo(client, slug);

console.log(player)