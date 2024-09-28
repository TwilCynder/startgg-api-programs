import { Query } from './lib/query.js';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserSetsChars.txt");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from user ${params.slug} ...`,
    error: params => `Request failed for user ${params.slug} ...`
}

function runQueryWithSlug(client, slug, limiter, max, after){
    return query.executePaginated(client, {slug, after}, "user.player.sets.nodes", limiter, {maxElements: max});
}

function runQueryWithID(client, id, limiter, max, after){
    return query.executePaginated(client, {id, after}, "user.player.sets.nodes", limiter, {maxElements: max});
}

function getRunF(slugOrID){
    return slugOrID > 0 ? runQueryWithID : runQueryWithSlug;
}

async function getUserSetsChars_(client, runF = runQueryWithSlug, slugOrID, limiter, max, after, until){
    let sets = await runF(client, slugOrID, limiter, max, after);
    return sets && until ? sets.filter(set => !until || set.completedAt < until) : sets;
}

export function getUserSetsChars(client, slugOrID, limiter, max, after, until){
    return getUserSetsChars_(client, getRunF(slugOrID), slugOrID, limiter, max, after, until);
}

export function getUsersSetsChars(client, slugsOrIDs, limiter, max, after, until){
    return Promise.all(slugsOrIDs.map(slugOrID => getUserSetsChars(client, slugOrID, max, limiter, after, until).catch((err) => console.log("Slug", slug, "kaput : ", err))));
}
