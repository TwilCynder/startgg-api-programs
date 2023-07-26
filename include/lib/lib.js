import { relurl } from "./dirname.js";
import fs from 'fs';

export function readSchema(source, filename){
    return fs.readFileSync(relurl(source, filename), {encoding: "utf-8"});
}

export function readLines(filename){
    return fs.readFileSync(filename).toString('utf-8').replaceAll('\r', '').split('\n');
}

export async function readJSONAsync(filename){
    const buf = await fs.promises.readFile(filename);
    return JSON.parse(buf);
}