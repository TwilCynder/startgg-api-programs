import { EventListParser } from "./include/lib/computeEventList.js";
import { OutputModeParser, SingleOptionParser, parseArguments } from "@twilcynder/arguments-parser"; 

import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter } from "startgg-helper-node";

import fs from 'fs';
import { getTournamentImage, getTournamentLogo } from "./include/getTournamentImage.js";

let [slugs] = parseArguments(process.argv.slice(2), 
    new EventListParser()
)

let limiter = new StartGGDelayQueryLimiter();

let data = await Promise.all(slugs.map(slug => getTournamentLogo(client, slug, limiter)));

limiter.stop();

console.log(data);