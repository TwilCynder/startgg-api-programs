import { getSetsInEvents } from "../include/getSetsInEvents.js";

import { EventListParser } from "../include/lib/computeEventList.js";
import { SingleOptionParser, parseArguments } from "@twilcynder/arguments-parser"; 

import { client } from "../include/lib/common.js";
import { StartGGDelayQueryLimiter } from "../include/lib/queryLimiter.js";

import fs from 'fs';
import { Query } from "../include/lib/query.js";
import { readSchema } from "../include/lib/lib.js";

let [output, slugs] = parseArguments(process.argv.slice(2), 
    new SingleOptionParser("-o"),
    new EventListParser()
)

let query = new Query(readSchema(import.meta.url, "../include/GraphQLSchemas/EventSetsGames.txt"))
let limiter = new StartGGDelayQueryLimiter();
let data = await getSetsInEvents(client, query, slugs, limiter);

limiter.stop();

console.log(data);

let filename = "./out/" + output;
let file = fs.createWriteStream(filename, {encoding: "utf-8"});
file.write(JSON.stringify(data));