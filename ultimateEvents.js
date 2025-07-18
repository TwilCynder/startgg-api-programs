import { argv, exit } from "process";
import { getEvents } from "./include/geteventsForVideogame.js";
import { client } from "./include/lib/client.js";
import fs from 'fs';
import fsp from 'fs/promises';

if (argv.length < 3){
    console.error("Usage : ", argv[0], argv[1], "outputFilename");
    exit(1);
}
const outputFilename = argv[2];

let events = await getEvents(client, 2000, [1386], null, (events, index) => {
    fsp.writeFile("./out/tournaments" + index + ".json", JSON.stringify(events));
})

//console.log(events);

fs.writeFileSync(outputFilename, JSON.stringify(events));