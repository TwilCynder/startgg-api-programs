import { Query } from './lib/query.js';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserSetsChars.txt");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from user ${params.slug} ...`,
    error: params => `Request failed for user ${params.slug} ...`
}

export async function getUserSetsChars(client, slug, limiter, after, until){
    let sets = await query.executePaginated(client, {slug, after}, "user.player.sets.nodes", limiter);
    return sets ? sets.filter(set => !until || set.completedAt < until) : sets;
}

export function getUsersSetsChars(client, slugs, limiter, after, until){
    return Promise.all(slugs.map(slug => getUserSetsChars(client, slug, limiter, after, until).catch((err) => console.log("Slug", slug, "kaput : ", err))));
}
