import {client} from "./include/lib/client.js"
import {getHead2Head} from "./include/head2head.js";
import { Player } from "./include/player.js";

if (process.argv.length < 4 ){
    console.log("Need two arguments");
    process.exit()
}

let players = [new Player(process.argv[2]), new Player(process.argv[3])];
await Player.loadPlayers(client, players);

let h2h = await getHead2Head(client, players[0], players[1]);

console.log(h2h.toString())