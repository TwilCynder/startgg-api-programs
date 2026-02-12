import fs from 'fs';
import { readJSONFromStdin, readLinesInFiles } from './readUtil.js';
import { toJSON } from 'startgg-helper-node/util';
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

/**
 * @param {string} text 
 */
export function splitWhitespace(text){
    return text.split(/\s+/g).filter(s=>s);
}

export function keepProperties(obj, ...properties){
    properties = properties.flat();
    let res = {};
    for (const key of properties){
        res[key] = obj[key];
    }
    return res;
}

export function excludeProperties(obj, ...properties){
    properties = properties.flat();
    return Object.fromEntries(Object.entries(obj).filter(([k, _]) => !properties.includes(k)))
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

/**
 * @param {Date} date 
 */
export function dateText(date){
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * @param {Date} date 
 */
export function timeText(date){
    return `${dateText(date)} - ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
}

/**
 * @param {Date} date 
 * @param {string} format 
 */
export function timeTextFormat(date, format){
    return format
        .replace('y', date.getFullYear)
        .replace('m', date.getMonth()+1)
        .replace('d', date.getDate())
        .replace('h', date.getHours())
        .replace('M', date.getMinutes())
        .replace('s', date.getSeconds())
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
 * @param {string} filename 
 * @param {number} i 
 */
function getFragmentFilenameFunction(filename){
    if (filename.includes("%")) return i => filename.replace(/%/g, i);
    
    let extension, name;
    const lastPointIndex = filename.lastIndexOf(".");
    if (lastPointIndex < 0 || lastPointIndex >= filename.length - 1){
        extension = "";
        name = filename;
    } else {
        extension = filename.slice(lastPointIndex)
        name = filename.slice(0, lastPointIndex);
    }

    return i => name + "-" + i + extension;
}

function writeJSON(filename, data, prettyJSON){
    fs.writeFileSync(filename, toJSON(data, prettyJSON), {encoding: "utf-8"}); 
}

function saveJSON(data, filename, prettyJSON, fragmentSize){
    if (fragmentSize && typeof fragmentSize === "number"){
        if (data instanceof Array){ 
            const filenameFunction = getFragmentFilenameFunction(filename);
            for (let i = 0; i < data.length; i += fragmentSize){
                const fragmentName = filenameFunction(i);
                writeJSON(fragmentName, data.slice(i, i + fragmentSize), prettyJSON);
            }
        } else {
            console.error("Script error : tried to fragment output data that isn't iterable");
            writeJSON(filename, data, prettyJSON); //allez en vria on fait quand même dans le doute
        }
    } else {
        writeJSON(filename, data, prettyJSON);
    }
}

function outputJSON_(prettyJSON, filename, printdata, data, fragmentSize){
    if (printdata){
        console.log(toJSON(data, prettyJSON));
    }
    if (filename){
        saveJSON(data, filename, prettyJSON, fragmentSize);
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
export function output(format, filename, printdata, data, CSVtransform, fragmentSize){
    if (!filename && !printdata) return;

    if (!format || !format.includes("csv")){
        output_(filename, printdata, CSVtransform ? CSVtransform(data) : "");
    } else {
        outputJSON_(format == "prettyjson", filename, printdata, data, fragmentSize);
    }
}

/**
 * Manages output for a script that can only output JSON, no matter of the script can also log readable data. 
 */
export function outputJSON(data, filename, printdata, prettyJSON, fragmentSize){
    outputJSON_(prettyJSON, filename, printdata, data, fragmentSize);
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
export function tryReadJSONInput(inputfile){
    return inputfile ? readJSONInput(inputfile).catch(err => {
        console.warn(`Could not open file ${inputfile} : ${err}`)
        return [];
    }) : []
}

/**
 * @param {string} inputfile 
 * @returns {Promise<any[]>}
 */
export async function tryReadJSONArray(inputfile){
    if (!inputfile) return [];

    let fields = splitWhitespace(inputfile);
    if (fields.length > 1){
        return await Promise.all(fields.map(filename => tryReadJSONArray(filename))).then(arrays => arrays.flat())
    } else {
        let value = await readJSONInput(inputfile);
        if (!(value instanceof Array)){
            console.error("Input file", inputfile, "does not contain a JSON array. Got", value);
            return [];
        }
        return value;
    }
}

/**
 * @template T
 * @param {(Promise<T[]>?)[]} promises 
 */
export function aggregateArrayDataPromises(promises){
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
 * @param {string} inputfile 
 * @param {boolean} stdinput 
 * @param {Promise<any>} APIPromise 
 * @returns 
 */
export function readMultimodalArrayInput(inputfile, APIPromise){
    return aggregateArrayDataPromises([tryReadJSONInput(inputfile), APIPromise]);
}

/**
 * @param {string} inputfile 
 * @param {boolean} stdinput 
 * @param {() => Promise<any[]>} APIFetcher 
 */
export function readMultimodalArrayInputWrapper(inputfile, APIFetcher){
    return readMultimodalArrayInput(inputfile, APIFetcher());
}

/**
 * 
 * @param {string[]} filter_words 
 * @param {string[]} filter_word_files 
 */
export async function readEventFilterWords(filter_words, filter_word_files){
    let filters = (await readLinesInFiles(filter_word_files, false))
        .filter(v => !!v)
        .map(filter_line => {
            const fields = filter_line.trim().split(/\s+/g);
            if (fields.length > 1){
                return {filter_word: fields[0], exceptions: fields.slice(1)}
            } else {
                return filter_line;
            }
        })

    return filters.concat(filter_words).flat();
}