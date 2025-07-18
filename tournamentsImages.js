import { EventListParser } from "./include/lib/computeEventList.js";
import { parseArguments } from "@twilcynder/arguments-parser"; 

import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper";

import { getTournamentLogo } from "./include/getTournamentImage.js";

let [slugs] = parseArguments(process.argv.slice(2), 
    new EventListParser()
)

let limiter = new StartGGDelayQueryLimiter();

let data = await Promise.all(slugs.map(slug => getTournamentLogo(client, slug, limiter)));

limiter.stop();

console.log(data);