import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';

const schema = readSchema(import.meta.url, "./GraphQLSchemas/EventEntrEventsByVideogameantsCount.gql");
const query = new Query(schema, 3);

const perPage = 100;
const lastPage = 50;

async function getEventsPage(client, videogames, page, before = undefined, after = undefined){
    console.log("Getting page : ", page);
    try {
        return await client.request(schema, {
            videogames: videogames,
            page: page,
            perPage: perPage,
            before : before,
            after: after
        })
    } catch (e) {
        console.log("/!\\ Request failed for page, ", page, ", retrying. Message : ", e)
        await new Promise(r => setTimeout(r, 1000));
        return getEventsPage(client, videogames, page, before, after);
    }
}

function filter(array, filter){
    return filter ? array.filter(filter) : array;
}

export async function getEventsBefore(client, delay, videogames, before, tournamentFilter){
    console.log("Fetching events for videogame", videogames, "before", before)
    let res = [];
    let page = 0;
    let quit = false;
    let promises = [];
    let mostRecent = null;
    while (!quit && page < lastPage){
        page++;
        let page_ = page;
        let promise = getEventsPage(client, videogames, page, before)
            .then( data => {
                if (!data.tournaments) return;
                let tnodes = data.tournaments.nodes;
                console.log("Got", tnodes.length, "tournaments for page", page_);
                if (tnodes.length < 1) {
                    quit = true;
                    mostRecent = null;
                } else if (page_ == lastPage){
                    let lastTournament = tnodes[tnodes.length - 1];
                    mostRecent = lastTournament.startAt;
                }
                res.push(...filter(tnodes, tournamentFilter));
            });

        promises.push(promise);

        if (delay)
            await new Promise(r => setTimeout(r, delay));
        
    };

    await Promise.all(promises)

    return {
        events: res,
        mostRecent : mostRecent
    };
}

export async function getEvents(client, delay, videogames, tournamentFilter, callback){
    let tournaments = [];
    let time = undefined;
    let index = 0;

    do {
        let data = await getEventsBefore(client, delay, videogames, time, tournamentFilter);
        tournaments.push(...data.events);
        console.log("Total size is now", tournaments.length);
        callback(data.events, index);
        time = data.mostRecent;
        if (time) time += 1;
        console.log("Most recent :", time);
        index++;
    } while (time);

    return tournaments;
}