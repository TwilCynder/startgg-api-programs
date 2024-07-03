import { Query } from './lib/query.js';
import { deep_get, readSchema } from './lib/lib.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventsFromUser.txt");
const query = new Query(schema, 3);

query.log = {
  query: params => `Fetching events attended by user ${params.slug} (page ${params.eventsPage} of events, ${params.eventsPerPage} per page) ...`,
  error: params => `Request failed for user ${params.slug} ...`
}

async function getEventsPage(client, slug, limiter = null, page, silentErrors = false){
  let data = await query.execute(client, {slug, eventsPage: page}, limiter, silentErrors);
  console.log("Fetched events page", page, "for user slug", slug);
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

async function processPage(client, slug, limiter, currentList, page, after = null, until = null){
  let events = await getEventsPage(client, slug, limiter, page);
   if (!events) throw `No result for slug ${slug} page ${page}`;

  for (let ev of events){

    if (until && ev.startAt > until) continue;
    if (after && ev.startAt < after) return false;

    currentList.push(ev);

  }

  console.log("Got page", page, "result :", events.length)

  return events.length > 0;
}

export async function getEventsFromUser(client, slug, limiter, after = null, until = null){
  if (!after && !until){ //we don't have to check each page, we can go for a simple paginated query
    return query.executePaginated(client, {slug}, "user.events.nodes", limiter, null, null, "eventsPage");
  } else {
    let result = [];

    console.log("doing the thing")

    let page = 1
    while (await processPage(client, slug, limiter, result, page, after, until)){
      page++    
    }

    return result;
  }
}

export async function getEventsFromUsers(client, slugs, limiter, after = null, until = null){
  let results = await Promise.all(slugs.map( slug => getEventsFromUser(client, slug, limiter, after, until).catch((err) => console.warn("Slug", slug, "kaput : ", err))))

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