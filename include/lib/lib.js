import { relurl } from "./dirname.js";
import fs from 'fs';

export function readSchema(source, filename){
    return fs.readFileSync(relurl(source, filename), {encoding: "utf-8"});
}

/**
 * Reads all lines of a file into an array
 * @param {string} filename 
 * @returns {string[]}
 */
export function readLines(filename){
    return fs.readFileSync(filename).toString('utf-8').replaceAll('\r', '').split('\n');
}

export async function readJSONAsync(filename){
    const buf = await fs.promises.readFile(filename);
    return JSON.parse(buf);
}

export function deep_get(obj, path, def = null){
    //https://stackoverflow.com/a/8817473
    for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
        obj = obj[path[i]];
        if (obj == undefined) return def;
    };
    return obj;
};