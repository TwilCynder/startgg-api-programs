import fs from 'fs';

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

    let resultString = (format == "csv") ?
        (CSVtransform(data) ?? "") :
        JSON.stringify(data, null, format == "prettyjson" ? 4 : undefined);


    if (filename){
        fs.mkdir("out", ()=>{})
        filename = "./out/" + filename;
        let file = fs.createWriteStream(filename, {encoding: "utf-8"});
        file.write(resultString);
    } 
    if (printdata) {
        console.log(resultString);
    }
}