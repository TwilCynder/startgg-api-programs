import fs from 'fs';
import { readJSONFromStdin, readLinesInFiles } from './readUtil.js';
import { toJSON } from 'startgg-helper-node/util';
import { readJSONInput, readLinesAsync } from './readUtil.js';
import { relurl } from "./dirname.js"
import { extractSlug } from 'startgg-helper-node';

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
 * Converts a number to a date, assuming it's a UNIX timestamp (second-based, not milisecond-based)
 * @param {Date | number} date 
 */
function toDate(date){
    if (date instanceof Date){
        return date;
    }
    return new Date(date * 1000);
}

/**
 * @param {Date} date 
 */
export function dateText(date){
    date = toDate(date);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * @param {Date} date 
 */
export function timeText(date){
    date = toDate(date);
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

//======== OUTPUT ========
const PRETTY_JSON_SPACES = 4;
const FORMAT_ALIASES = {
    readable: "prettyjson",
    csv: "text"
};
const DEFAULT_FORMAT = "json";

export function getExtension(fname){
    //Credit : VisioN https://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript/12900504#12900504
    return fname.slice((fname.lastIndexOf(".") - 1 >>> 0) + 2);
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

function write(filename, text){
    if (filename == "@stdout") console.log(text);
    else fs.writeFileSync(filename, text, {encoding: 'utf-8'});
}

function writeOutputs(filenames, text){
    for (const filename of filenames){
        if (filename){
            write(filename, text);
        } else {
            console.log(text);
        }
    }
}

function handleTextOutputs(filenames, data, CSVTransform){
    const text = CSVTransform(data);
    writeOutputs(filenames, text);
}

function writeJSONOutputs(filenames, data, spaces){
    const text = JSON.stringify(data, null, spaces);
    writeOutputs(filenames, text);
}

function writeJSONFragmentOutputs(filenameFunctions, data, spaces, fragmentID){
    const text = JSON.stringify(data, null, spaces);
    for (const filenameFunction of filenameFunctions){
        if (filenameFunction){
            const realFilename = filenameFunction(fragmentID);
            write(realFilename, text);
        } else {
            console.log(text);
        }
    }
}

function handleJSONOutputs(filenames, data, fragmentSize, spaces){
    if (!filenames || filenames.length < 1) return;

    if (fragmentSize && typeof fragmentSize === "number"){
        if (data instanceof Array){ 
            const filenameFunctions = filenames.map(filename => filename && getFragmentFilenameFunction(filename));

            for (let i = 0; i < data.length; i += fragmentSize){
                writeJSONFragmentOutputs(filenameFunctions, data.slice(i, i + fragmentSize), spaces, i);
            }
        } else {
            console.error("Script error : tried to fragment output data that isn't iterable");
            writeJSONOutputs(filenames, data, spaces); //allez en vrai on fait quand même dans le doute
        }
    } else {
        writeJSONOutputs(filenames, data, spaces);
    }
}

function registerOutput(formatArrays, filename, format){
    let arr = formatArrays[FORMAT_ALIASES[format] ?? format];
    if (!arr){
        console.error("Unsupported format :", format);
        return;
    }
    arr.push(filename);
}

/**
 * Manages output for a script able to log readable data, output JSON, and output CSV
 * @template T
 * @param {string[]} outputfiles 
 * @param {boolean} printdata 
 * @param {string?} format 
 * @param {import('./paramConfig.js').Output[]} formattedOutput 
 * @param {T} data 
 * @param {(data: T) => string} CSVtransform 
 * @param {number?} fragmentSize 
 * @returns 
 */
export function output(outputfiles, printdata, format, formattedOutput = [], data, CSVtransform, fragmentSize){
    let sortedOutputs = {text: [], json: [], prettyjson: []}

    if (printdata){
        registerOutput(sortedOutputs, null, format ?? DEFAULT_FORMAT);
    }
    for (const filename of outputfiles){
        registerOutput(sortedOutputs, filename, format ?? getExtension(filename) ?? DEFAULT_FORMAT)
    }

    for (const output of formattedOutput){
        registerOutput(sortedOutputs, output.filename, output.format);
    }

    handleTextOutputs(sortedOutputs.text, data, CSVtransform);
    handleJSONOutputs(sortedOutputs.json, data, fragmentSize);
    handleJSONOutputs(sortedOutputs.prettyjson, data, fragmentSize, PRETTY_JSON_SPACES);
}

/**
 * Manages output for a script able to log readable data, output JSON, and output CSV, taking all parameters from the result of an ArgumentsManager parsing, assuming the functions in paramConfig.js were used
 * @template T
 * @param {{outputFiles: string[], printdata: boolean, outputFormat: string, formattedOutput: import('./paramConfig.js').Output[], fragmentOutput: number}} args
 * @param {T} data 
 * @param {(data: T) => string} CSVtransform 
 * @returns 
 */
export function outputFromArgs(args, data, CSVTransform){
    return output(args.outputFiles, args.printdata, args.outputFormat, args.formattedOutput, data, CSVTransform, args.fragmentOutput)
}

/**
 * Manages output for a script that can only output JSON, no matter if the script can also log readable data. 
 */
export function outputJSON(data, outputFiles, printdata, prettyJSON, formattedOutput, fragmentSize){
    let sortedOutputs = {json: [], prettyjson: []}

    if (printdata){
        (prettyJSON ? sortedOutputs.prettyjson : sortedOutputs.json).push(null);
    }
    for (const filename of outputFiles){
        (prettyJSON ? sortedOutputs.prettyjson : sortedOutputs.json).push(filename);
    }

    for (const output of formattedOutput){
        registerOutput(sortedOutputs, output, output.format);
    }

    handleJSONOutputs(sortedOutputs.json, data, fragmentSize);
    handleJSONOutputs(sortedOutputs.prettyjson, data, fragmentSize, PRETTY_JSON_SPACES);
}

export function outputJSONFromArgs(args, data){
    return outputJSON(data, args.outputFiles, args.printdata, args.prettyjson, args.formattedOutput, args.fragmentOutput);
}


/**
 * Manages output for a script that can only output a text
 */
export function outputText(text, outputFiles, printdata){
    if (printdata){
        console.log(text);
    }
    for (const filename of outputFiles){
        write(filename, text);
    }
}

/**
 * Manages output for a script that can output a text *maybe* (i.e. can also log data)
 * @param {string} outputFiles 
 * @param {boolean} printdata 
 * @param {any} data 
 * @param {(data: any) => string} textTransform 
 */
export function outputTextLazy(textTransform, outputFiles, printdata, data){
    if ((outputFiles && outputFiles.length) || printdata){
        outputText(textTransform(data), outputFiles, printdata)
    }
}

export function extractUserDiscriminator(slug){
    return slug.includes("/") ? slug = slug.split("/").at(-1) : slug;
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
            let arr = lines.filter(line => !!line && line != "null" && line != "undefined").map(slug => {
                slug = extractSlug(slug.trim());
                slug = extractUserDiscriminator(slug);
                return slug;
            });
            return (existingArray && existingArray.length) ? existingArray.concat(arr) : arr;
        } 
    } 
    return existingArray ?? [];
}

/**
 * 
 * @param {string} inputfile 
 * @param {boolean} stdinput 
 */
export function tryReadJSONInput(inputfile){
    return inputfile ? readJSONInput(inputfile).catch(err => {
        console.warn(`Could not open file ${inputfile} : ${err}`)
        return null;
    }) : null
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
        let value = await tryReadJSONInput(inputfile);
        if (!(value instanceof Array)){
            if (value) console.error("Input file", inputfile, "does not contain a JSON array. Got", value);
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

/**
 * @typedef {(obj: any) => string} textFieldFunction
 * @param {string} line_format 
 * @param {Object<string, textFieldFunction>} textFunctions 
 * @param {textFieldFunction[]} defaultLineFunctions 
 * @param {string[]} mandatories 
 */
export function getLineFormatFunctions(line_format, textFunctions, defaultLineFunctions, mandatories){
    if (line_format){
        /** @type {textFieldFunction[]} */
        let lineFunctions = [];

        let mandatoriesUsed = Object.fromEntries(mandatories.map(elt => [elt, false]));
        for (let word of line_format.split(/\s+/g)){
            word = word.trim();
            if (!word) continue;

            if (mandatoriesUsed[word] === false) mandatoriesUsed[word] = true;

            const f = textFunctions[word];
            if (!f) {
                console.error("Bad property name in line format :", word, ". Possible names are " + Object.keys(textFunctions).join(", "));
                process.exit(1);
            }
            if (f) lineFunctions.push(f);
        }

        for (const mandatoryKey in mandatoriesUsed){
            if (!mandatoriesUsed[mandatoryKey] && textFunctions[mandatoryKey]) lineFunctions.push(textFunctions[mandatoryKey]) 
        }

        return lineFunctions
    } else {
       return defaultLineFunctions;
    }
}

export function generateLineUsingLineFunctions(object, lineFunctions){
    let line = "";
    for (const f of lineFunctions){
        if (!f) continue;
        line += f(object) + '\t'
    }
    return line.replace(/\t+$/g, "");
}

export function nullArray(arr){
    return !arr || arr.length < 1
}