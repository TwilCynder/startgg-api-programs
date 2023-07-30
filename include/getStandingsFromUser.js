import { readFileSync } from 'fs';
import { relurl } from './lib/dirname.js';

const standingsSchemaFilename = "./GraphQLSchemas/StandingsFromUser.txt";

const standingsSchema = readFileSync(relurl(import.meta.url, standingsSchemaFilename), {encoding: "utf-8"});

const perPage = 3;

async function getStandingsPage(client, id, page){
    console.log("Getting page : ", page, "from ID", id);
    try {
        return await client.request(standingsSchema, {
            id: id,
            page: page
        });
    } catch (e) {
        console.log("/!\\ Request failed, retrying.", "Message : ", e);
        return getStandingsPage(client, id, page);
    }
    
}

var prevTimestamp;

async function processStandingsPage(client, standingsList, id, page, after = null, until = null){
    let response = await getStandingsPage(client, id, page);
    let events = response.user.events.nodes;

    for (let ev of events){

      if (ev.startAt > prevTimestamp){
        console.log("==========SORT FAULT !!!!==========")
      }
      prevTimestamp = ev.startAt;

      if (until && ev.startAt > until) continue;
      if (after && ev.startAt < after) return false;
      if (ev.entrantSizeMin > 1) continue;

      if (standingsList[ev.id]) continue;

      standingsList.list[ev.id] = ev.standings.nodes;
      standingsList.list[ev.id].tournamentName = ev.tournament.name;
      standingsList.list[ev.id].id = ev.id;
      standingsList.size++;

    }
    return events.length >= perPage;
}

export async function processStandingsFromPlayer(client, id, events, delay, after = null, until = null){
  prevTimestamp = Infinity;
    let page = 1

    while (await processStandingsPage(client, events, id, page, after, until)){
      page++    
      if (delay)
          await new Promise(resolve => setTimeout(resolve, delay));
    }
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