import { Query } from './lib/query.js';
import { readSchema } from './lib/lib.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserSets.txt");
const query = new Query(schema, 3);

export function getUserSets(client, slug, after = undefined, limiter = null){
    return query.executePaginated(client, {slug, after}, "user.player.sets.nodes", limiter);
}

export function getUsersSets(client, ids, after, limiter){
    return Promise.all(ids.map(id => getUserSets(client, id, after, limiter).catch((err) => console.log("ID", id, "kaput : ", err))));
}
