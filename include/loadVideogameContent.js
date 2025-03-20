import { readJSONInput } from './lib/readUtil.js';
import { getVideogameContent } from './getVideogameContent.js';
import { existsSync, writeFile } from 'fs';
import { GraphQLClient } from 'graphql-request';
import { TimedQuerySemaphore } from './lib/queryLimiter.js';

function convert(list){
    let res = {}
    for (let val of list){
        res[val.id] = val.name;
    }

    return res;
}

/**
 * Returns an object containing characters and stages data for a given game, reading from a file if it exists, and writing to it if it didn't
 * @param {string} filename 
 * @param {GraphQLClient} client 
 * @param {TimedQuerySemaphore} limiter 
 * @param {string} slug 
 * @param {boolean} writeIfNeeded 
 * @returns 
 */
export async function loadVideogameContent(filename, client, limiter, slug, writeIfNeeded = true){
    //INSERT BETTER CACHE SYSTEM HERE
    let data;
    if (filename){
        if (existsSync(filename)){
            return await readJSONInput(filename);
        }
    }
    
    if (client && slug){
        data = await getVideogameContent(client, slug, limiter);
        
        if (writeIfNeeded && filename){
            if (writeIfNeeded){
                if (filename){
                    console.log("Writing videogame content for slug", slug, "in file", filename);
                    writeFile(filename, JSON.stringify(data), () => {
                        console.log("Finished Writing videogame content for slug", slug, "in file", filename);
                    })
                } else {
                    console.warn("Tried to save game content info after loading it from startgg, but no filename was specified");
                }
            }
        }
    } else {
        if (!filename){
            console.error("Tried to load game content info, but neither a filename or a slug and client were provided")
        }
    }

    if (!data){
        console.warn("Could not load videogame content info");
    }

    if (data.characters) data.characters = convert(data.characters);
    if (data.stages) data.stages = convert(data.stages);

    return data;
}

/**
 * Returns characters data for a given game, reading from a file if it exists, and writing to it if it didn't
 * @param {string} filename 
 * @param {GraphQLClient} client 
 * @param {TimedQuerySemaphore} limiter 
 * @param {string} slug 
 * @param {boolean} writeIfNeeded 
 * @returns 
 */
export async function loadCharactersInfo(filename, client, limiter, slug, writeIfNeeded = true){
    let data = await loadVideogameContent(filename, client, limiter, slug, writeIfNeeded);
    return data ? data.characters : null;
}

/**
 * Returns stages data for a given game, reading from a file if it exists, and writing to it if it didn't
 * @param {string} filename 
 * @param {GraphQLClient} client 
 * @param {TimedQuerySemaphore} limiter 
 * @param {string} slug 
 * @param {boolean} writeIfNeeded 
 * @returns 
 */
export async function loadStagedInfo(filename, client, limiter, slug, writeIfNeeded = true){
    let data = await loadVideogameContent(filename, client, limiter, slug, writeIfNeeded);
    return data ? data.stages : null;
}