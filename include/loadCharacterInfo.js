import fs, { writeFileSync } from 'fs';
import { readJSONAsync } from './lib/jsUtil.js';
import { getVideogameCharacters } from './getVideogameCharacters.js';

function convertCharsList(list){
    let chars = {}
    for (let char of list){
        chars[char.id] = char.name;
    }
    return chars;
}

export async function loadCharacterInfo(filename, client, limiter, slug, writeIfNeeded){

    if (filename){
        if (fs.existsSync(filename)){
            return convertCharsList(await readJSONAsync(filename));
        }
    }

    if (client && slug) {
        let charsList = await getVideogameCharacters(client, slug, limiter);
        if (!charsList) throw "Slug didn't return any videogame";

        if (writeIfNeeded && filename){
            writeFileSync(filename, JSON.stringify(charsList));
        }

        return convertCharsList(charsList);
    }
}