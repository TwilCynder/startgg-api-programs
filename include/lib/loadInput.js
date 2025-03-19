import fs from 'fs/promises'

//ça on renomme fileutil

function didTheyMeanStdin(name){
    return name == "@stdin";
} 

/**
 * Reads data from stdin once
 * @returns {Promise<string>}
 */
function readFromStdin(){
    let data = "";
    let callback = (data_) => {
        data += data_.toString();
    }
    return new Promise((resolve, reject) => {
        process.stdin.once("end", () => {
            resolve(data);
            process.stdin.removeListener("data", callback);
            process.stdin.pause();
        })
        process.stdin.addListener("data", callback) 
    })
}

/**
 * Fetches a text input either from the given file or the standard input
 * @param {string} inputFile
 */
export async function readText(inputFile){
    return await (didTheyMeanStdin() ? readFromStdin() : fs.readFile(inputFile).then(buf => buf.toString('utf-8')))
}

/**
 * Loads the input data as JSON text either from the given file or the standard input
 * @param {string} inputFile 
 * @returns 
 */
export async function readJSONInput(inputFile){
    let text = await readText(inputFile);
    return JSON.parse(text);
}

export async function readJSONFromStdin(){
    let text = await readFromStdin();
    return JSON.parse(text);
}