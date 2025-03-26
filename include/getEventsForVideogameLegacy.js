import { readFileSync } from 'fs';
import { relurl } from './lib/dirname.js';

const schemaFilename = "./GraphQLSchemas/EventsByVideogame.gql";

const schema = readFileSync(relurl(import.meta.url, schemaFilename), {encoding: "utf-8"});

const perPage = 100;
const promisesFIFOSize = 10;

async function getEventsPage(client, videogames, page, after = undefined, before = undefined){
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
        console.log("/!\\ Request failed, retrying. Message : ", e)
        return getEventsPage(client, videogames, page, after, before);
    }
    
}

class FIFO {
    constructor(size){
        this.size = size || 10
        this.list = []
        this.pointer = 0;
    }   

    add(element) {
        if (this.list.length < 10){
            this.list.push(element)
        } else {
            this.list[this.pointer] = element;
            this.pointer++;
            if (this.pointer >= this.size) this.pointer = 0;
        }
    }
}

function filter(array, filter){
    return filter ? array.filter(filter) : array
}

async function getEvents(client, delay, videogames, dataProcessing, ...extra){
    console.log("Fetching events for videogame", videogames)
    let res = [];
    let page = 0;
    let quit = false;
    let promises = [];
    do {
        page++;
        let promise = getEventsPage(client, videogames, page)
            .then( data => {
                if (dataProcessing.apply(null, [res, data].concat(extra))){
                    quit = true;
                }
            });

        promises.push(promise);

        if (delay)
            await new Promise(r => setTimeout(r, delay));

    } while (!quit && page < 99);

    await Promise.all(promises)

    return res;
}

function eventListDataProcessing(res, data, tournamentFilter, eventFilter){
    if (!data.tournaments) return;
    let tnodes = data.tournaments.nodes;
    if (tnodes.length < 1) return true;
    for (let tnode of filter(tnodes, tournamentFilter)){   
        if (tnode.events){
            res.push(...filter(tnode.events, eventFilter.bind(null, tnode)));
        }
    }
}

function tournamentsListDataProcessing(res, data, tournamentFilter){
    if (!data.tournaments) return;
    let tnodes = data.tournaments.nodes;
    console.log("Processing", data.tournaments.nodes.length);
    if (tnodes.length < 1) return true;
    res.push(...filter(tnodes, tournamentFilter));
}

export async function getEventsList(client, delay, videogames, tournamentFilter, eventfilter){
    return getEvents(client, delay, videogames, eventListDataProcessing, tournamentFilter, eventfilter);
}

export async function getTournamentsList(client, delay, videogames, tournamentFilter){
    return getEvents(client, delay, videogames, tournamentsListDataProcessing, tournamentFilter);
}