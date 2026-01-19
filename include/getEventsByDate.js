import { deep_get, Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';

const baseQuery = new Query(readSchema(import.meta.url, "./GraphQLSchemas/EventsByDate.gql"), 3);
const detailedQuery = new Query(readSchema(import.meta.url, "./GraphQLSchemas/EventsByDateDetailed.gql"), 3);

function describeParams(params){
    return `events between dates ${params.afterDate} and ${params.beforeDate} (page ${params.page}, ${params.perPage} per page${params.games ? (", with games " + params.games) :""}${params.minEntrants ? `, minimum ${params.minEntrants} entrants` :""}${params.countryCode ? ", in country " + params.countryCode :""})`;
}

const logConfig = {
  query: params => "Fetching " + describeParams(params),
  error: params => `Failed to fetch ` + describeParams(params)
};

baseQuery.log = logConfig;
detailedQuery.log = logConfig;

/**
 * @param {number} startDate 
 * @param {number} endDate 
 * @param {{games: number[], minEntrants: number, countryCode: string, online: boolean, future: boolean, singles_only: boolean}} config 
 * @param {boolean} detailed 
 */
export async function getEventsByDate(client, limiter, startDate, endDate, config, detailed){
    const query = detailed ? detailedQuery : baseQuery;

    const data = await query.executePaginated(client, {afterDate: startDate, beforeDate: endDate, countryCode: config.countryCode ?? undefined, games: config.games, online: config.online || null, teamType: config.singles_only ? [1] : null}, "tournaments", limiter, {perPage: 200});

    if (!data || !data.length) {
        console.warn("Couldn't fetch events for dates", startDate, endDate);
        return null;
    };

    let result = [];
    if (detailed){
      result = data.map(tournament => (tournament.events ?? []).map(event => Object.assign(event, {tournamentName: tournament.name}))).flat();
      if (config.minEntrants) result = result.filter(event => event.numEntrants >= config.minEntrants);
    } else {
      result = data.map(tournament => (tournament.events ?? [])).flat();
    }

    if (!config.future){
      result = result.filter(event => {
        let completed = event.state == "COMPLETED";
        delete event.state;
        return completed;
      })
    }
    
    return result;
}
