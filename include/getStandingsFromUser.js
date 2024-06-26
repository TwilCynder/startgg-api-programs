import { Query } from './lib/query.js';
import { readSchema } from './lib/lib.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/StandingsFromUser.txt");
const query = new Query(schema, 3);

const PER_PAGE = 3;

async function getStandingsPage(client, slug, limiter = null, page, perPage = PER_PAGE, silentErrors = false){
  let data = await query.execute(client, {slug, page, perPage}, limiter, silentErrors);
  console.log("Fetched standings page", page, "for user slug", slug);
  let result = deep_get(data, "user.events.nodes");
  return result;
}

var prevTimestamp;
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

async function processStandingsPage(client, slug, limiter, currentList, page, after = null, until = null, perPage = PER_PAGE){
  let events = await getStandingsPage(client, slug, limiter, page, false);
   if (!events) throw `No result for slug ${slug} page ${page}`;

  for (let ev of events){

    if (ev.startAt > prevTimestamp){
      console.warn("==========SORT FAULT !!!!==========");
    }
    prevTimestamp = ev.startAt;

    if (until && ev.startAt > until) continue;
    if (after && ev.startAt < after) return false;

    currentList.push(ev);

  }
  return events.length > 0;
}

export async function getStandingsFromUser(client, slug, limiter, after = null, until = null){
  if (!after && !until){ //we don't have to check each page, we can go for a simple paginated query
    return query.executePaginated(client, {slug, standingsPerPage: 500, standingsPage: 1}, "user.events.nodes", limiter, null, null, "eventsPage");
  } else {
    prevTimestamp = Infinity;
    let result = [];

    let page = 1
    while (await processStandingsPage(client, result, id, page, after, until)){
      page++    
    }

    return result;
  }
}

export async function getStandingsFromUsers(client, slugs, limiter, after = null, until = null){
  let standings 
}

export async function processStandingsSync(client, users, after = null, until = null){
  let events = {size: 0, list: {}};

  let count = 0;
  for (let user of users){
      console.log("Loading sets from user ", user.name, "with ID", user.id);
      await processStandingsFromPlayer(client, user.id, events, 200, after, until);
      count = events.size;
      console.log("Current events count : ", count)
  }

  return events;
}