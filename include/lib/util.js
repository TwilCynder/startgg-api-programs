import fs from 'fs';
import { loadInputFromStdin } from './loadInputStdin.js';
import { readJSONAsync, readLinesAsync, toJSON } from './jsUtil.js';
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

export function outputText(text, filename, printdata){
    output_(filename, printdata, text);
}

export async function readUsersFile(filename, existingArray){
    if (filename){
        let lines = await readLinesAsync(filename);
        if (lines && lines.length){
            let arr = lines.filter(line => !!line && line != "null" && line != "undefined").map(line => line.trim());
            return (existingArray && existingArray.length) ? existingArray.concat(arr) : arr;
        }
    } else {
        return existingArray;
    }
}

/**
 * 
 * @param {string} inputfile 
 * @param {boolean} stdinput 
 */
function readInputText(inputfile, stdinput){
    return [
        inputfile ? readJSONAsync(inputfile).catch(err => {
            console.warn(`Could not open file ${inputfile} : ${err}`)
            return [];
        }) : null,
    
        stdinput ? loadInputFromStdin() : null,
    ]
}

/**
 * 
 * @param {(Promise<any[]>?)[]} promises 
 */
function aggregateDataPromises(promises){
    return Promise.all(promises).then(results => results.flat());
}

/**
 * 
 * @param {string} inputfile 
 * @param {boolean} stdinput 
 */
export function readInputData(inputfile, stdinput){
    return aggregateDataPromises(readInputText(inputfile, stdinput));
}

/**
 * @param {string} inputfile 
 * @param {boolean} stdinput 
 * @param {Promise<any>} APIPromise 
 * @returns 
 */
export function readMultimodalInput(inputfile, stdinput, APIPromise){
    return aggregateDataPromises(readInputText(inputfile, stdinput).concat(APIPromise));
}

/**
 * @param {string} inputfile 
 * @param {boolean} stdinput 
 * @param {() => Promise<any[]>} APIFetcher 
 */
export function readMultimodalInputWrapper(inputfile, stdinput, APIFetcher){
    return readMultimodalInput(inputfile, stdinput, APIFetcher());
}