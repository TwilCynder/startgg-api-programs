import {Query} from "startgg-helper-node";
import { readSchema } from "./lib/util.js";

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventID.gql");
const query = new Query(schema, 3);

export async function doesEventExist(client, slug, limiter){
    let data = await query.execute(client, {slug}, limiter);

    return data && data.event;
}