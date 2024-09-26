import { GraphQLClient } from 'graphql-request';
import { getUserInfo } from './getUserInfo.js';
import { deep_get } from './lib/jsUtil.js';

/**
 * Returns the player name ("gamertag") associated with a user slug
 * @param {GraphQLClient} client 
 * @param {string} slug 
 * @param {any} limiter 
 * @param {boolean} silent 
 * @returns {Promise<string?>}
 */
export async function getPlayerName(client, slug, limiter = null, silent = false){
    let userInfo = getUserInfo(client, slug, limiter);
    return deep_get(userInfo, "player.gamerTag");
}

export function getPlayersNames(client, slugs, limiter = null){
    return Promise.all(slugs.map((slug) => getPlayerName(client, slug, limiter).catch((err) => console.log("User slug", slug, "kaput : ", err))));
}

