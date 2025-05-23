import fs from 'fs';
import { readJSONFromStdin } from './readUtil.js';
import { toJSON } from './jsUtil.js';
import { readJSONInput, readLinesAsync } from './readUtil.js';
import { relurl } from "./dirname.js"

//scriptutil

/**
 * 
 * @param {string} text 
 * @returns 
 */ 
export function splitNewline(text){
    return text.replace(/\r/g, "").split("\n");
}

export function splitWhitespace(text){
    return text.split(/\s+/g).filter(s=>s);
}

/**
 * Reads a CSV text into an array of arrays. 
 * Does not even try to handle edge cases, use a real csv package if you need to read complicated/weird CSVs
 * @param {string} text 
 * @param {{separator: string, delimiter: string}} options 
 */
export function parseCSV(text, options){    

    options = Object.assign({delimiter: 'newline', separator: ','}, options);
    let lines = options.delimiter == "newline" ? 
        splitNewline(text) :
        text.split(options.delimiter);

    return lines.filter(line => !!line).map(line => line.trim().split(options.separator));
}//scriptsutil

export function readSchema(source, filename){
    return fs.readFileSync(relurl(source, filename), {encoding: "utf-8"});
}

export function columns(...text){
    return text.join('\t');
}

export function columnsln(...text){
    return columns(...text) + '\n';
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
 * Manages output for a script able to log readable data, output JSON, and output CSV
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

/**
 * Manages output for a script that can only output JSON, no matter of the script can also log readable data. 
 */
export function outputJSON(data, filename, printdata, prettyJSON){
    output_(filename, printdata, toJSON(data, prettyJSON));
}

/**
 * Manages output for a script that can only output a text
 */
export function outputText(text, filename, printdata){
    output_(filename, printdata, text);
}

/**
 * Manages output for a script that can output a text *maybe* (i.e. can also log data)
 * @param {string} filename 
 * @param {boolean} printdata 
 * @param {any} data 
 * @param {(data: any) => string} textTransform 
 */
export function outputTextLazy(textTransform, filename, printdata, data){
    if (filename || printdata){
        outputText(textTransform(data), filename, printdata)
    }
}

/**
 * 
 * @param {string} filename 
 * @param {string[]} existingArray 
 * @returns 
 */
export async function readUsersFile(filename, existingArray){
    if (filename){
        let lines = await readLinesAsync(filename);
        if (lines && lines.length){
            let arr = lines.filter(line => !!line && line != "null" && line != "undefined").map(line => line.trim());
            return (existingArray && existingArray.length) ? existingArray.concat(arr) : arr;
        } 
    } 
    return existingArray;
}

/**
 * 
 * @param {string} inputfile 
 * @param {boolean} stdinput 
 */
function readInputText(inputfile, stdinput){
    return [
        inputfile ? readJSONInput(inputfile).catch(err => {
            console.warn(`Could not open file ${inputfile} : ${err}`)
            return [];
        }) : null,
    
        stdinput ? readJSONFromStdin() : null,
    ]
}

/**
 * @template T
 * @param {(Promise<T[]>?)[]} promises 
 */
export function aggregateDataPromises(promises){
    return Promise.all(promises).then(results => 
        results
            .map(elt => {
                if (elt instanceof Array) return elt;
                else if (elt instanceof Object) return Object.entries(elt);
                return elt;
            })
            .filter(v=>!!v)
            .flat()
    );
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