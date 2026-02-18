import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';
import { deep_get } from 'startgg-helper-node/util';
import { GraphQLClient } from 'graphql-request';
import { TimedQuerySemaphore } from 'startgg-helper';
import { finalizeUserEventsConfig } from './userEventsQueriesUtil.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventsFromUser.gql");
const query = new Query(schema, 3);

query.log = {
  query: params => `Fetching events attended by user ${params.slug} (page ${params.eventsPage} of events, ${params.eventsPerPage} per page, games: ${params.games}, minimum ${params.minEntrants} entrants) ...`,
  error: params => `Request failed for user ${params.slug} ...`
}

/** @typedef {{startDate: number, endDate: number, games: number[], minEntrants: number}} GEFUConfig */

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string} slug 
 * @param {TimedQuerySemaphore} limiter 
 * @param {number} page 
 * @param {GEFUConfig} config 
 * @returns 
 */
async function getEventsPage(client, slug, limiter = null, page, config){
  let data = await query.execute(client, {slug, eventsPage: page, games: config.games, minEntrants: config.minEntrants}, limiter, false);
  console.log("Fetched events page", page, "for user slug", slug);
  let result = deep_get(data, "user.events.nodes");
  return result;
}


/**
 * 
 * @param {GraphQLClient} client 
 * @param {string} slug 
 * @param {TimedQuerySemaphore} limiter 
 * @param {any[]} currentList 
 * @param {number} page 
 * @param {GEFUConfig} config 
 * @returns 
 */
async function processPage(client, slug, limiter, currentList, page, config = {}){
  let until = config.endDate;
  let after = config.startDate;
  
  let events = await getEventsPage(client, slug, limiter, page, config);
   if (!events) throw `No result for slug ${slug} page ${page}`;

  for (let ev of events){

    if (until && ev.startAt > until) continue;
    if (after && ev.startAt < after) return false;

    currentList.push(ev);
  }

  console.log("Got page", page, "result :", events.length)

  return events.length > 0;
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string} slug 
 * @param {TimedQuerySemaphore} limiter 
 * @param {import('./userEventsQueriesUtil.js').FinalizedUserEventsConfig} config 
 */
async function getEventsFromUser_(client, slug, limiter, config){
  if (!config.startDate && !config.endDate){ //we don't have to check each page, we can go for a simple paginated query
    return query.executePaginated(client, {slug, games: config.games, minEntrants: config.minEntrants}, "user.events", limiter, {pageParamName: "eventsPage"});
  } else {
    let result = [];

    let page = 1
    while (await processPage(client, slug, limiter, result, page, config)){
      page++    
    }

    return result;
  }
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string} slug 
 * @param {TimedQuerySemaphore} limiter 
 * @param {import('./userEventsQueriesUtil.js').RawUserEventsConfig} config 
 * @returns 
 */
export async function getEventsFromUser(client, slug, limiter, config = {}){
  return getEventsFromUser_(client, slug, limiter, await finalizeUserEventsConfig(config, client, limiter));
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string[]} slug 
 * @param {TimedQuerySemaphore} limiter 
 * @param {import('./userEventsQueriesUtil.js').RawUserEventsConfig} config 
 * @returns 
 */
export async function getEventsFromUsers(client, slugs, limiter, config){

  const finalizedConfig = await finalizeUserEventsConfig(config, client, limiter);
  console.log(finalizedConfig);

  let results = await Promise.all(slugs.map( slug => getEventsFromUser_(client, slug, limiter, finalizedConfig).catch((err) => console.warn("Slug", slug, "kaput : ", err))))

  let dict = {};
  for (let list of results){
    if (!list) continue;

    for (let event of list){

      dict[event.id] = event;
    }
  }

  let list = Object.values(dict);

  return list.sort((a, b) => a.startAt < b.startAt);
}