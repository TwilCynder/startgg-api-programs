import { relurl } from "./lib/dirname.js";
import { readFileSync } from 'fs';
import { Query } from "./lib/query.js"

const schemaFilename = "./GraphQLSchemas/EventInfo.txt";
const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

const query = new Query(schema, 3);

export async function getEventInfo(client, slug, limiter = null){
    let res = await query.execute(client, {slug}, limiter);

    if (!res.event) throw "Slug " + slug + " not found.";

    console.log("Fetched infos for event", slug);

    return res.event;
}

export function getEventsInfo(client, slugs, limiter){
    return Promise.all(slugs.map((slug) => getEventInfo(client, slug, limiter).catch((err) => console.log("Slug", slug, "kaput : ", err))));
}