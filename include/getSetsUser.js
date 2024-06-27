import { Query } from './lib/query.js';
import { readSchema } from './lib/lib.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserSets.txt");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching entrants from user ${params.slug} ...`,
    error: params => `Request failed for user ${params.slug} ...`
}

export function getUserSets(client, slug, after = undefined, limiter = null){
    return query.executePaginated(client, {slug, after}, "user.player.sets.nodes", limiter);
}

export function getUsersSets(client, slugs, after, limiter){
    return Promise.all(slugs.map(slug => getUserSets(client, slug, after, limiter).catch((err) => console.log("Slug", slug, "kaput : ", err))));
}
