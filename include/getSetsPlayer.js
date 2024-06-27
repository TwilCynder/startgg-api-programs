import { Query } from './lib/query.js';
import { readSchema } from './lib/lib.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/PlayerSets.txt");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from player ${params.id} ...`,
    error: params => `Request failed for player ${params.id} ...`
}

export function getPlayerSets(client, id, after = undefined, limiter = null){
    return query.executePaginated(client, {id, after}, "user.player.sets.nodes", limiter);
}

export function getPlayersSets(client, ids, after, limiter){
    return Promise.all(slugs.map(slug => getPlayerSets(client, slug, after, limiter).catch((err) => console.log("Slug", slug, "kaput : ", err))));
}
