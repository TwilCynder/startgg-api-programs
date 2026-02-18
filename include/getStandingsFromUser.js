import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';
import { deep_get } from 'startgg-helper-node/util';
import { GraphQLClient } from 'graphql-request';
import { TimedQuerySemaphore } from 'startgg-helper';
import { finalizeUserEventsConfig } from './userEventsQueriesUtil.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/StandingsFromUser.gql");
const query = new Query(schema, 3);

query.log = {
  query: params => `Fetching standings from events attended by user ${params.slug} (page ${params.eventsPage} of events, ${params.eventsPerPage} per page; page ${params.standingsPage} of standings, ${params.standingsPerPage} per page for each event) ...`,
  error: params => `Request failed for user ${params.slug} ...`
}

const STANDINGS_PER_PAGE = 96;


async function getStandingsPage(client, slug, limiter = null, page, standingsPage = 1, standingsPerPage = STANDINGS_PER_PAGE, silentErrors = false, config){
  let data = await query.execute(client, {slug, eventsPage: page, eventsPerPage: 5, standingsPage, standingsPerPage, games: config.games, minEntrants: config.minEntrants}, limiter, silentErrors);
  console.log("Fetched standings page", page, "for user slug", slug);
  let result = deep_get(data, "user.events.nodes");
  return result;
}

async function processStandingsPage(client, slug, limiter, currentList, page, config = {}){
  let until = config.endDate;
  let after = config.startDate;
  
  let events = await getStandingsPage(client, slug, limiter, page, undefined, undefined, undefined, config);
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
 * @returns 
 */
async function getStandingsFromUser_(client, slug, limiter, config){
  if (!config.startDate && !config.startDate){ //we don't have to check each page, we can go for a simple paginated query
    return query.executePaginated(client, {slug, standingsPerPage: STANDINGS_PER_PAGE, standingsPage: 1, games: config.games, minEntrants: config.minEntrants}, "user.events", limiter, {pageParamName: "eventsPage"});
  } else {
    let result = [];

    let page = 1
    while (await processStandingsPage(client, slug, limiter, result, page, config)){
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
 * @returns {Promise<{}>}
 */
export async function getStandingsFromUser(client, slug, limiter, config){
  return getStandingsFromUser_(client, slug, limiter, await finalizeUserEventsConfig(config, client, limiter));
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string[]} slugs 
 * @param {TimedQuerySemaphore} limiter 
 * @param {import('./userEventsQueriesUtil.js').RawUserEventsConfig} config 
 * @param {string[]} eventsBlacklist slugs of events to ignore
 * @returns {Promise<{}[]>}
 */
export async function getStandingsFromUsers(client, slugs, limiter, config, eventsBlacklist){
  
  const finalizedConfig = await finalizeUserEventsConfig(config, client, limiter);

  let results = await Promise.all(slugs.map( slug => getStandingsFromUser_(client, slug, limiter, finalizedConfig).catch((err) => console.warn("Slug", slug, "kaput : ", err))))

  let dict = {};
  for (let list of results){
    if (!list) continue;

    for (let event of list){
      dict[event.slug] = event;
    }
  }

  if (eventsBlacklist){
    for (let event of eventsBlacklist){
      delete dict[event];
    }
  }

  let list = Object.values(dict);

  return list.sort((a, b) => a.startAt < b.startAt);
}