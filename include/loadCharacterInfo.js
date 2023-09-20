import fs from 'fs';
import { readJSONAsync } from './lib/lib.js';
import { getCharacters } from './getVideogameCharacters.js';

function convertCharsList(list){
    let chars = {}
    for (let char of list){
        chars[char.id] = char.name;
    }
    return chars;
}

export async function loadCharacterInfo(filename, client, slug, writeIfNeeded){
    try {
        fs.accessSync(filename);
        return convertCharsList(await readJSONAsync(filename));
    } catch (e) {
        if (client && slug) {
            let charsList = await getCharacters(client, slug);

            if (writeIfNeeded){
                let file = fs.createWriteStream(filename, {encoding: "utf-8"});
                file.write(JSON.stringify(result));
            }

            return convertCharsList(charsList);
        }

        throw e;
    }
}