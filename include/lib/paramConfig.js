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

/**
 * Added dests : outputfile, printdata, silent, prettyjson
 * @param {ArgumentsManager} argumentsManager 
 */
export function addOutputParamsJSON(argumentsManager){
    addOutputParamsBasic(argumentsManager);
    argumentsManager.addSwitch(["-r", "--readable-json"], {description: "Makes the JSON output human-readable", dest: "prettyjson"})
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

/**
 * Returns a function to pass to .apply  
 * Potential dests : outputfile, printdata, silent, logdata, outputFormat
 * @param {boolean} log 
 * @param {boolean} format 
 * @returns 
 */
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
        .addOption(["-i", "--input-file"], {dest: "inputfile", description: "A file containing pre-downloaded data"})
        .addSwitch(["-S", "--stdin-input"], {dest: "stdinput", description: "Enable reading start.gg data from stdin (downloaded by another script)"})
}

/**
 * Dests added : games, minEntrants, startDate, endDate
 * @param {ArgumentsManager} argumentsManager 
 */
export function addEventQueryFilterParams(argumentsManager){
    argumentsManager
        .addOption("--start-date", {
            dest: "startDate",
            description: "Only count tournaments after this UNIX date"
        })
        .addOption("--end-date", {
            dest: "endDate",
            description: "Only count tournaments before this UNIX date"
        })
        .addOption(["-g", "--games"], {description: "Comma-separated list of videogames to limit search to. Can be start.gg game slugs or numerical IDs"})
        .addOption(["-m", "--min-entrants"], {dest: "minEntrants", type: "number", description: "Only count events with at least this number of entrants"})
}

/**
 * Dests added : exclude_expression, filter
 * @param {ArgumentsManager} argumentsManager 
 */
export function addEventPropertiesFilterParams(argumentsManager){
    argumentsManager
        .addMultiOption(["-R", "--exclude_expression"], {description: "Regular expressions that will remove events they match with"})
        .addMultiOption(["-b", "--filter"], {description: "Add a word filter. Events containing one of these words will be ignored"})
        .addSwitch(["-O", "--offline"], {description: "Only keep offline event"})
}

/**
 * Dests added : games, minEntrants, exclude_expression, filter, startDate, endDate
 * @param {ArgumentsManager} argumentsManager 
 */
export function addEventFilterParams(argumentsManager){
    addEventQueryFilterParams(argumentsManager);
    addEventPropertiesFilterParams(argumentsManager);
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