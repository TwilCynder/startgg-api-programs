import { readJSONInput } from './lib/loadInput.js';
import { getVideogameContent } from './getVideogameContent.js';
import { existsSync, writeFile } from 'fs';

export async function loadVideogameContent(filename, client, limiter, slug, writeIfNeeded){
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

    return data;
}

export async function loadCharactersInfo(filename, client, limiter, slug, writeIfNeeded){
    let data = await loadVideogameContent(filename, client, limiter, slug, writeIfNeeded);
    return data ? data.characters : null;
}

export async function loadStagedInfo(filename, client, limiter, slug, writeIfNeeded){
    let data = await loadVideogameContent(filename, client, limiter, slug, writeIfNeeded);
    return data ? data.stages : null;
}