import fs from 'fs';

/**
 * Reads all lines of a file into an array
 * @param {string} filename 
 * @returns {string[]}
 */
export function readLines(filename){
    return fs.readFileSync(filename).toString('utf-8').replaceAll(/\r/g, '').split('\n');
}

/**
 * Reads all line of a file into an array
 * @param {string} filename 
 */
export function readLinesAsync(filename){
    return fs.promises.readFile(filename)
        .then(buf => buf.toString('utf-8').replace(/\r/g, '').split('\n'));
}

/**
 * @param {any[]} currentList 
 * @param {string[]} filenames 
 */
export function readLinesInFiles(filenames){
    return Promise.all(filenames.map(filename => {
        return readLinesAsync(filename).catch("Coundl't read provided filename " + filename)
            .then(lines => lines.filter(line => !!line))
    })).then(lists => lists.flat())
}

export async function readJSONAsync(filename){
    return fs.promises.readFile(filename)
        .then(buf => JSON.parse(buf))
}

function processObjectPath(path){
    path = path=path.split('.');
    for (let i = 0; i < path.length; i++){
        if (/^\d/.test(path[i])){
            let n = parseInt(path[i]);
            if (!isNaN){
                path[i] = n;
            }
        }
    }
    return path;
}

/**
 * 
 * @param {{}} obj 
 * @param {string} path 
 * @param {*} def 
 * @returns 
 */
export function deep_get(obj, path, def = null){
    //https://stackoverflow.com/a/8817473
    path = processObjectPath(path);

    for (var i=0, len=path.length; i<len; i++){
        obj = obj[path[i]];
        if (obj == undefined) return def;
    };
    return obj;
};

export function deep_set(obj, path, value){
    path = processObjectPath(path);

    let finalName = path.pop();
    for (let elt of path){
        obj = obj[elt];
        if (!(obj instanceof Object)){
            return false;
        }
    }
    obj[finalName] = value;
    return true;
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

/**
 * 
 * @param {any} data 
 * @param {boolean} pretty 
 */
export function toJSON(data, pretty){
    return JSON.stringify(data, null, pretty ? 4 : undefined);
}

export function isNumber(n){
    return typeof n == "number";
}

/**
 * 
 * @param {number | Date | string} d 
 */
export function toUNIXTimestamp(d){
    return isNumber(d) ? d : new Date(d).getTime() / 1000
}