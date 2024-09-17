//TODO : séparer proprement ce fichier de lib.js

import fs from 'fs';
import { loadInputFromStdin } from './loadInputStdin.js';
import { readJSONAsync, toJSON } from './jsUtil.js';
import { relurl } from "./dirname.js"

export function readSchema(source, filename){
    return fs.readFileSync(relurl(source, filename), {encoding: "utf-8"});
}

function output_(filename, printdata, resultString){
    if (filename){
        let file = fs.createWriteStream(filename, {encoding: "utf-8"});
        file.write(resultString);
    } 
    if (printdata) {
        console.log(resultString);
    }
}

/**
 * @template T
 * @param {"json" | "csv" | "prettyjson"} format 
 * @param {string} filename 
 * @param {boolean} printdata 
 * @param {T} data 
 * @param {(data: T) => string} CSVtransform 
 */
export function output(format, filename, printdata, data, CSVtransform){
    if (!filename && !printdata) return;

    let resultString = (!format || !format.includes("json")) ?
        (CSVtransform(data) ?? "") :
        toJSON(data, format == "prettyjson");
        

    output_(filename, printdata, resultString);
}

export function outputJSON(data, filename, printdata, prettyJSON){
    output_(filename, printdata, toJSON(data, prettyJSON));
}

/**
 * @param {string} inputfile 
 * @param {boolean} stdinput 
 * @param {() => Promise<any>} APIFetcher 
 */
export function readMultimodalInputWrapper(inputfile, stdinput, APIFetcher){
    return readMultimodalInput(inputfile, stdinput, APIFetcher());
}

/**
 * @param {string} inputfile 
 * @param {boolean} stdinput 
 * @param {Promise<any>} APIPromise 
 * @returns 
 */
export function readMultimodalInput(inputfile, stdinput, APIPromise){
    return Promise.all([
        inputfile ? readJSONAsync(inputfile).catch(err => {
            console.warn(`Could not open file ${inputfile} : ${err}`)
            return [];
        }) : null,
    
        stdinput ? loadInputFromStdin() : null,
    
        APIPromise
    ]).then(results => results.reduce((previous, current) => current ? previous.concat(current) : previous, []))
}