import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/PlayerSets.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from player ${params.id} ...`,
    error: params => `Request failed for player ${params.id} ...`
}

export async function getPlayerSets(client, id, limiter, after, until){
    let sets = await query.executePaginated(client, {id, after}, "user.player.sets.nodes", limiter);
    return sets ? sets.filter(set => !until || set.completedAt < until) : sets;
}

export function getUsersSets(client, IDs, limiter, after, until){
    return Promise.all(IDs.map(id => getPlayerSets(client, id, limiter, after, until).catch((err) => console.log("ID", id, "kaput : ", err))));
}
