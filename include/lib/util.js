import fs from 'fs';

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
 * 
 * @param {any} data 
 * @param {boolean} pretty 
 */
function toJSON(data, pretty){
    return JSON.stringify(data, null, pretty ? 4 : undefined);
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