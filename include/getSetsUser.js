import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserSets.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from user ${params.slug} ...`,
    error: params => `Request failed for user ${params.slug} ...`
}

export async function getUserSets(client, slug, limiter, after, until){
    let sets = await query.executePaginated(client, {slug, after}, "user.player.sets", limiter);
    return sets ? sets.filter(set => !until || set.completedAt < until) : sets;
}

export function getUsersSets(client, slugs, limiter, after, until){
    return Promise.all(slugs.map(slug => getUserSets(client, slug, limiter, after, until).catch((err) => console.log("Slug", slug, "kaput : ", err))));
}
