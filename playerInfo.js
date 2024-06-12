import { client } from "./include/lib/client.js";
import { getPlayerInfo } from "./include/getPlayerInfo.js";

if (process.argv.length < 3 ){
    console.log("Need one argument");
    process.exit()
}

let slug = process.argv[2]

console.log(slug)

let player = await getPlayerInfo(client, slug);

console.log(player)