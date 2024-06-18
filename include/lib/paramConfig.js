import { ArgumentsManager } from "@twilcynder/arguments-parser"

/**
 * Added dests : outputFormat, outputfile, logdata
 * @param {ArgumentsManager} argumentsManager 
 */
export function addOutputParams(argumentsManager){
    argumentsManager
        .addOption("--format", {
            dest: "outputFormat",
            description: "The output format. Either json (default) or csv"
        })
        .addOption(["-o", "--output_file"], {
            dest: "outputfile",
            description: "A file to save the output to. If not specified, the output will be sent to the std output."
        })
        .addSwitch(["-l", "--log-data"], {
            dest: "logdata",
            description: "Use to log the processed data (in a nice and pretty format) to the std output. True by default if neither -o or -p are specified."
        })
        .addSwitch(["-p", "--print-output"], {
            dest: "printdata",
            description: "Output the result to stdout"
        })
        .addSwitch(["-s", "--silent"], {
            description: "Do not log anything besides the output. True by default if printing the output to stdout"
        })
        
}

/**
 * Dests added : inputfile, stdinput
 * @param {ArgumentsManager} argumentsManager 
 */
export function addInputParams(argumentsManager){
    argumentsManager
        .addOption(["-i", "--input-file"], {dest: "inputfile"})
        .addSwitch(["-S", "--stdin-input"], {dest: "stdinput"})
}

/**
 * Returns two values, indicating if we should log data, and if the program should be silent
 * @param {boolean} logdata 
 * @param {boolean} printdata 
 * @param {string} outputfile 
 * @param {boolean} silent 
 * @returns 
 */
export function doWeLog(logdata, printdata, outputfile, silent){
    return [
        logdata || (!printdata && !outputfile && !silent),
        silent || printdata
    ]
}