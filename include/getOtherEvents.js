import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/SideEvents.gql");
const query = new Query(schema, 3);

query.log = {
  query: params => `Fetching other events in same tournament as ${params.slug} ...`,
  error: params => `Request failed for event ${params.slug} ...`
}

export async function getOtherEventsFromEvent(client, slug, limiter = null, silentErrors = false){
  let data = await query.execute(client, {slug}, limiter, silentErrors);
  if (!data.event) {
    console.warn("Coulnd't fetch info for event slug", slug);
    return null;
  }
  console.log("Fetched info for event slug", slug);
  
  return {
    tournament: {
      name: data.event.tournament.name,
      slug: data.event.tournament.slug
    },
    baseSlug: slug,
    events: data.event.tournament.events
  }

}

export function getOtherEventsFromEvents(client, slugs, limiter = null, silentErrors = false){
  return Promise.all(slugs.map((slug) => getOtherEventsFromEvent(client, slug, limiter, silentErrors).catch((err) => console.log("Event slug", slug, "kaput : ", err))));
}