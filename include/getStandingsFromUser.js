import { Query } from './lib/query.js';
import { readSchema } from './lib/util.js';
import { deep_get } from './lib/jsUtil.js';
import { GraphQLClient } from 'graphql-request';
import { TimedQuerySemaphore } from './lib/queryLimiter.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/StandingsFromUser.txt");
const query = new Query(schema, 3);

query.log = {
  query: params => `Fetching standings from events attended by user ${params.slug} (page ${params.eventsPage} of events, ${params.eventsPerPage} per page; page ${params.standingsPage} of standings, ${params.standingsPerPage} per page for each event) ...`,
  error: params => `Request failed for user ${params.slug} ...`
}

const STANDINGS_PER_PAGE = 96;

async function getStandingsPage(client, slug, limiter = null, page, standingsPage = 1, standingsPerPage = STANDINGS_PER_PAGE, silentErrors = false){
  let data = await query.execute(client, {slug, eventsPage: page, eventsPerPage: 5, standingsPage, standingsPerPage}, limiter, silentErrors);
  console.log("Fetched standings page", page, "for user slug", slug);
  let result = deep_get(data, "user.events.nodes");
  return result;
}

/*
async function processStandingsPage(client, slug, limiter, currentList, page, after = null, until = null, perPage = PER_PAGE){
    let events = await getStandingsPage(client, slug, limiter, page, perPage, false);
     if (!events) throw `No result for slug ${slug} page ${page} (${perPage} resutls per page)`;

    for (let ev of events){

      if (ev.startAt > prevTimestamp){
        console.warn("==========SORT FAULT !!!!==========");
      }
      prevTimestamp = ev.startAt;
 
      if (until && ev.startAt > until) continue;
      if (after && ev.startAt < after) return false;
      if (ev.entrantSizeMin > 1) continue;

      if (standingsList.list[ev.id]) continue;

      standingsList.list[ev.id] = ev.standings.nodes;
      standingsList.list[ev.id].tournamentName = ev.tournament.name;
      standingsList.list[ev.id].id = ev.id;
      standingsList.size++;

    }
    return events.length >= perPage;
}
*/

async function processStandingsPage(client, slug, limiter, currentList, page, after = null, until = null){
  let events = await getStandingsPage(client, slug, limiter, page);
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
 * @param {number} after 
 * @param {number} until 
 * @returns {Promise<{}>}
 */
export async function getStandingsFromUser(client, slug, limiter, after = null, until = null){
  if (!after && !until){ //we don't have to check each page, we can go for a simple paginated query
    return query.executePaginated(client, {slug, standingsPerPage: STANDINGS_PER_PAGE, standingsPage: 1}, "user.events.nodes", limiter, {pageParamName: "eventsPage"});
  } else {
    let result = [];

    let page = 1
    while (await processStandingsPage(client, slug, limiter, result, page, after, until)){
      page++    
    }

    return result;
  }
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string[]} slugs 
 * @param {TimedQuerySemaphore} limiter 
 * @param {number} after 
 * @param {number} until 
 * @param {string[]} eventsBlacklist slugs of events to ignore
 * @returns {Promise<{}[]>}
 */
export async function getStandingsFromUsers(client, slugs, limiter, after = null, until = null, eventsBlacklist){
  let results = await Promise.all(slugs.map( slug => getStandingsFromUser(client, slug, limiter, after, until).catch((err) => console.warn("Slug", slug, "kaput : ", err))))

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