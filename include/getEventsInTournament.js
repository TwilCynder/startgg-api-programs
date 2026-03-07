import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/Tournamentevents.gql");
const query = new Query(schema, 3);

query.log = {
  query: params => `Fetching events in tournament ${params.slug} ...`,
  error: params => `Request failed for tournament ${params.slug} ...`
}

export async function getEventsInTournament(client, slug, limiter = null, silentErrors = false){
  let data = await query.execute(client, {slug}, limiter, silentErrors);
  if (!data.tournament) {
    console.warn("Coulnd't fetch info for tournament slug", slug);
    return null;
  }
  console.log("Fetched info for tournament slug", slug);
  
  return data;
}

export function getEventsInTournaments(client, slugs, limiter = null, silentErrors = false){
  return Promise.all(slugs.map((slug) => getEventsInTournament(client, slug, limiter, silentErrors).catch((err) => console.log("Tournament slug", slug, "kaput : ", err))));
}