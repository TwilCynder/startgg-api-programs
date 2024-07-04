import { ArgumentsManager } from "@twilcynder/arguments-parser"


/**
 * Added dests : outputfile, printdata, silent
 * @param {ArgumentsManager} argumentsManager 
 */
export function addOutputParamsBasic(argumentsManager){
    argumentsManager
        .addOption(["-o", "--output_file"], {
            dest: "outputfile",
            description: "A file to save the output to. If not specified, the output will be sent to the std output."
        })
        .addSwitch(["-p", "--print-output"], {
            dest: "printdata",
            description: "Output the result to stdout"
        })
        .addSwitch(["-s", "--silent"], {
            description: "Do not log anything besides the output. True by default if printing the output to stdout"
        })
}

function addLogParameter(argumentsManager){
    argumentsManager.addSwitch(["-l", "--log-data"], {
        dest: "logdata",
        description: "Use to log the processed data (in a nice and pretty format) to the std output. True by default if neither -o or -p are specified."
    })
}

function addFormatParameter(argumentsManager){
    argumentsManager.addOption("--format", {
        dest: "outputFormat",
        default: "json",
        description: "The output format. Either json (default) or csv"
    })
}

export function addOutputParamsCustom(log, format){
    return argumentsManager => {
        addOutputParamsBasic(argumentsManager);
        if (log) addLogParameter(argumentsManager);
        if (format) addFormatParameter(argumentsManager);
    }
}

/**
 * Added dests : outputFormat, outputfile, logdata, printdata, silent
 * @param {ArgumentsManager} argumentsManager 
 */
export function addOutputParams(argumentsManager){
    addOutputParamsBasic(argumentsManager);
    addLogParameter(argumentsManager);
    addFormatParameter(argumentsManager);
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
 * @param {boolean} printdata 
 * @param {string} outputfile 
 * @param {boolean} silent 
 */
export function isSilent(printdata, silent){
    return silent || printdata;
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
        isSilent(printdata, silent)
    ]
}