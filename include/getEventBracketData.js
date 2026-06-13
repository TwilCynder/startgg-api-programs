import { Query } from 'startgg-helper';
import { readSchema } from './lib/util.js';
import { GraphQLClient } from 'graphql-request';
import { TimedQuerySemaphore } from 'startgg-helper';



const setsQuery = new Query(readSchema(import.meta.url, "./GraphQLSchemas/EventSetsProgression.gql"), 3);
const seedsQuery = new Query(readSchema(import.meta.url, "./GraphQLSchemas/EventSeeds.gql"), 3);

setsQuery.log = {
    query: params => `Fetching sets progression for event ${params.slug} (page ${params.page}) ...`,
    error: params => `Request sets progression for event ${params.slug} (page ${params.page}) ...`
}
seedsQuery.log = {
    query: params => `Fetching seeds for event ${params.slug} (pages ${params.page}) ...`,
    error: params => `Request seeds for event ${params.slug} (pages ${params.page}) ...`
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {string} slug 
 * @param {number} numEntrants 
 * @param {TimedQuerySemaphore} limiter 
 * @returns {Promise<{}>}
 */
export async function getEventSetsProgression(client, slug, limiter = null){
    console.log("Getting sets from event : ", slug);

    let sets = await setsQuery.executePaginated(client, {slug}, "event.sets", limiter, {});
    if (!sets) {
        console.warn("Couldn't fetch sets for event", slug);
        return null;
    }

    console.log("Fetched sets for event", slug);

    return sets;
}

export async function getEventSeeds(client, slug, limiter = null){
    let res = []

    let page1 = await seedsQuery.execute(client, {slug, page: 1}, limiter);
    if (!page1 || !page1.event){
        console.warn("Counld't fetch seeds for event", slug);
        return []
    }

    let maxPage = 0;
    for (const phaseGroup of page1.event.phaseGroups){
        if (!phaseGroup.seeds) {
            res.push([]);
            continue;
        }
        if (maxPage < phaseGroup.seeds.pageInfo.totalPages) maxPage = phaseGroup.seeds.pageInfo.totalPages;
        res.push(phaseGroup.seeds.nodes);
    }

    if (maxPage > 1){
        for (let pageIndex = 2; pageIndex <= maxPage; i++){
            let page = await seedsQuery.execute(client, {slug, page: pageIndex}, limiter);
            for (let i = 0; i < phaseGroups.length; i++){
                res[i] = res[i].concat(phaseGroup.seeds.nodes);
            }
        }
    }

    console.log("Fetched seeds for event", slug);

    return res;
}

export async function getEventBracketData(client, slug, limiter = null){
    return Promise.all([
        getEventSetsProgression(client, slug, limiter),
        getEventSeeds(client, slug, limiter)
    ]).then(([sets, seeds]) => {
        if (!sets){
            return {};
        } else {
            return {sets, seeds};
        }
    });
}

/**
 * @param {GraphQLClient} client 
 * @param {string[]} slugs 
 * @param {TimedQuerySemaphore} limiter 
 * @returns {Promise<{}[]>}
 */
export function getEventsBracketData(client, slugs, limiter = null){
    return Promise.all(slugs.map((slug) => getEventBracketData(client, slug, limiter)
        .catch((err) => {console.warn("Slug", slug, "kaput : ", err); return {}})
        .then(data => Object.assign(data, {slug}))
    ));
}

/**
 * 
 * @param {GraphQLClient} client 
 * @param {Object[]} events 
 * @param {TimedQuerySemaphore} limiter 
 */
export function getEventsBracketDataFromObjects(client, events, limiter){
    return Promise.all(events.map(async event => {
        if (!event.slug) {
            console.error("Event object with no slug :", event);
            return event;
        }
        const data = await getEventBracketData(client, event.slug, limiter);
        Object.assign(data, event);
        return data;
    }))
}