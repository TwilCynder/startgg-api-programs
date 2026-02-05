import { GraphQLClient } from 'graphql-request';
import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';
import { TimedQuerySemaphore } from 'startgg-helper';
import { getUserSetsGeneric, getUserSetsGenericFromObjects, getUsersSetsGeneric } from './getUserSetsGeneric.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/UserSetsChars.gql");
const query = new Query(schema, 3);

query.log = {
    query: params => `Fetching sets from user ${params.id ? params.id : params.slug} ...`,
    error: params => `Request failed for user ${params.id ? params.id : params.slug} ...`
}

/**
 * @param {GraphQLClient} client 
 * @param {string | number} slugOrID 
 * @param {TimedQuerySemaphore} limiter 
 * @param {{max?: number, after?: number, until?:number}} config 
 * @returns 
 */
export function getUserSetsChars(client, slugOrID, limiter, config){
    return getUserSetsGeneric(query, client, slugOrID, limiter, config);
}

/**
 * @param {GraphQLClient} client 
 * @param {(string|number)[]} slugsOrIDs 
 * @param {TimedQuerySemaphore} limiter 
 * @param {{max?: number, after?: number, until?:number}} config 
 * @returns 
 */
export function getUsersSetsChars(client, slugsOrIDs, limiter, config){
    return getUsersSetsGeneric(query, client, slugsOrIDs, limiter, config);
}

export function getUserSetsCharsFromObjects(client, users, limiter, config){
    return getUserSetsGenericFromObjects(query, client, users, limiter, config);
}