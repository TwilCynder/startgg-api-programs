import { ArgumentsManager } from "@twilcynder/arguments-parser"

//ça ça reste ici

/**
 * Added dests : outputfile, printdata, silent  
 * Added switchs : [o]uput_file, [p]rint-output, [s]silent  
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
 * Added switchs : [o]uput_file, [p]rint-output, [s]silent, [r]eadable-json  
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
 * For scripts that can only output processed text.  
 * Added dests : outputfile, printdata, silent, logdata  
 * Added switchs : [o]uput_file, [p]rint-output, [s]silent, [l]og-data  
 * @param {ArgumentsManager} argumentsManager 
 */
export function addOutputParamsText(argumentsManager){
    addOutputParamsBasic(argumentsManager);
    addLogParameter(argumentsManager);
}

/**
 * Returns a function to pass to .apply    
 * Added dests : outputfile, printdata, silent  
 * Potential dests : logdata, outputFormat  
 * Added switchs : [o]uput_file, [p]rint-output, [s]silent  
 * Potential switchs : [l]og-data, format  
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
 * Added switchs : [o]uput_file, [p]rint-output, [s]silent, [p]rint-output, format
 * @param {ArgumentsManager} argumentsManager 
 */
export function addOutputParams(argumentsManager){
    addOutputParamsBasic(argumentsManager);
    addLogParameter(argumentsManager);
    addFormatParameter(argumentsManager);
}

/**
 * Dests added : inputfile, stdinput  
 * Added switchs : [i]nput-file, [S]/stdin-input
 * @param {ArgumentsManager} argumentsManager 
 */
export function addInputParams(argumentsManager){
    argumentsManager
        .addOption(["-i", "--input-file"], {dest: "inputfile", description: "A file containing pre-downloaded data"})
        .addSwitch(["-S", "--stdin-input"], {dest: "stdinput", description: "Enable reading start.gg data from stdin (downloaded by another script)"})
}

/**
 * Dests added : startDate, endDate  
 * Switchs added : start-date, end-date
 * @param {ArgumentsManager} argumentsManager 
 */
export function addEventDateFilterParams(argumentsManager){
    argumentsManager
        .addOption("--start-date", {
            dest: "startDate",
            description: "Only count tournaments after this UNIX date"
        })
        .addOption("--end-date", {
            dest: "endDate",
            description: "Only count tournaments before this UNIX date"
        })
}

/**
 * Dests added : games
 * Switchs added : [g]ames
 * @param {ArgumentsManager} argumentsManager 
 */
export function addEventGameFilterParams(argumentsManager){
    argumentsManager
        .addOption(["-g", "--games"], {description: "Comma-separated list of videogames to limit search to. Can be start.gg game slugs or numerical IDs"})
}

/**
 * Dests added : offline, online
 * Switchs added : [O]ffline, o[N]line 
 * @param {ArgumentsManager} argumentsManager 
 */
export function addEventOnlineFilterParams(argumentsManager){
    argumentsManager
        .addSwitch(["-O", "--offline"], {description: "Only keep offline events"})
        .addSwitch(["-N", "--online"], {description: "Only keep online events"})
}

/**
 * Dests added : exclude_expression, filter, minEntrants
 * Added switchs : [R]/exclude_expression, [b]/filter, [m]in-entrants
 * @param {ArgumentsManager} argumentsManager 
 */
export function addEventGenericFilterParams(argumentsManager){
    argumentsManager
        .addMultiOption(["-R", "--exclude_expression"], {description: "Regular expressions that will remove events they match with"})
        .addMultiOption(["-b", "--filter"], {description: "Add a word filter. Events containing one of these words will be ignored"})
        .addOption(["-m", "--min-entrants"], {dest: "minEntrants", type: "number", description: "Only count events with at least this number of entrants"})
}

const eventFilterParamFunctions = [
    addEventDateFilterParams,
    addEventGameFilterParams,
    addEventOnlineFilterParams,
    addEventGenericFilterParams
]

/**
 * Dests added : games, minEntrants, exclude_expression, filter, startDate, endDate, offline
 * Added switchs : [R]/exclude_expression, [b]/filter, [O]/offline, start-date, end-date, [g]ames, [m]in-entrants
 * @param {ArgumentsManager} argumentsManager 
 */
export function addEventFilterParams(argumentsManager){
    for (const f of eventFilterParamFunctions){
        f(argumentsManager);
    }
}

/**
 * Adds event filter parameters except if the corresponding function is included in this function's arguments
 * Dests potentially added : games, minEntrants, exclude_expression, filter, startDate, endDate, offline
 * Switches potentially added : [R]/exclude_expression, [b]/filter, [O]/offline, start-date, end-date, [g]ames, [m]in-entrants
 * @param {ArgumentsManager} argumentsManager 
 */
export function addEventFilterParamsExcept(argumentsManager, ...exclude){
    exclude = exclude.flat();
    for (const f of eventFilterParamFunctions){
        if (!exclude.includes(f)) f(argumentsManager);
    }
}

/**
 * Dests added : userSlugs, filename, userDataFile
 * start-date, [f]ilename, [D]/user-data-file
 * @param {ArgumentsManager} argumentsManager 
 */
export function addUsersParams(argumentsManager){
    argumentsManager
    .addMultiParameter("userSlugs", {
        description: "A list of users slugs to fetch events for"
    })
    .addOption(["-f", "--filename"], {
        description: "Path to a file containing a list of user slugs"
    })
    .addOption(["-D", "--user-data-file"], {
        dest: "userDataFile",
        description: "File containing user data"
    })
    
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
 * @returns [logdata, silent]
 */
export function doWeLog(logdata, printdata, outputfile, silent){
    return [
        logdata || (!printdata && !outputfile && !silent),
        isSilent(printdata, silent)
    ]
}