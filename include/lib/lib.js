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

/**
 * Reads all line of a file into an array
 * @param {string} filename 
 */
export function readLinesAsync(filename){
    return fs.promises.readFile(filename)
        .then(buf => buf.toString('utf-8').replace(/\r/g, '').split('\n'));
}

export async function readJSONAsync(filename){
    return fs.promises.readFile(filename)
        .then(buf => JSON.parse(buf))
}

export function deep_get(obj, path, def = null){
    //https://stackoverflow.com/a/8817473
    for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
        obj = obj[path[i]];
        if (obj == undefined) return def;
    };
    return obj;
};

export function outputString(s, outputMode){
    if (outputMode.file){
        let filename = "./out/" + outputMode.file;
        let file = fs.createWriteStream(filename, {encoding: "utf-8"});
    
        file.write(s);
    }
    
    if (outputMode.stdout){
        console.log(s);
    }

}

/**
 * 
 * @param {string} text 
 * @returns 
 */
export function splitNewline(text){
    return text.replace(/\r/g, "").split("\n");
}

export function splitWhitespace(text){
    return text.replace(/\s+/g, " ").split(" ");
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
}

let currentID = 1;
export function generateUniqueID(){
    return currentID++;
}

/**
 * 
 * @param {(() => any)[]} fArray 
 */
export function fResultsArray(fArray){
    let result = [];
    for (let f of fArray){
        let res = f();
        if (res !== undefined){
            result.push(res);
        }
    }

    return result;
} 

/**
 * 
 * @param  {...(() => any)} functions 
 */
export function fResults(...functions){
    return fResultsArray(functions);
}

let write = process.stdout.write;

export function muteStdout(){
    process.stdout.write = ()=>{};
}

export function unmuteStdout(){
    process.stdout.write = write;
}