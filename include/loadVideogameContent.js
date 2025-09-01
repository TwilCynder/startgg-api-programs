import { readJSONInput, stat } from './lib/readUtil.js';
import { getVideogameContent } from './getVideogameContent.js';
import { writeFile } from 'fs';
import { GraphQLClient } from 'graphql-request';
import { TimedQuerySemaphore } from 'startgg-helper';

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
        let s = await stat(filename);
        if (s){
            if (s.isDirectory()){
                if (!slug){
                    console.error("Tried to load game content info from a games cache directory, but no slug was specified");
                    return null;
                }
                filename += '/' + slug.replace('game/', '') + '.json'; 
                if (await stat(filename)){
                    return await readJSONInput(filename);
                }
            } else {
                return await readJSONInput(filename);
            }
        }
    } 
    
    if (client && slug){
        data = await getVideogameContent(client, slug, limiter);
        if (data){
            if (data.characters) data.characters = convert(data.characters);
            if (data.stages) data.stages = convert(data.stages);    
        }
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
export async function loadStagesInfo(filename, client, limiter, slug, writeIfNeeded = true){
    let data = await loadVideogameContent(filename, client, limiter, slug, writeIfNeeded);
    return data ? data.stages : null;
}