import { ArgumentsManager, Parser } from "@twilcynder/arguments-parser"
import { isThereAnyOutputFile, nullArray } from "./util.js";

//ça ça reste ici

export function argumentsManager(abstract){
    let am = new ArgumentsManager()
        .setParameters({
            guessLowDashes: true, recursiveResult: "allArgs",
            onMissingArgument: {message: "Missing argument"},
            onIncompleteArgument: {message: "Incomplete parameter : missing parameter after"},
            onError: {errorCode: 2, throw: false}
        })
        .enableHelpParameter()

    if (abstract) am.setAbstract(abstract);
    return am;
}

/** @typedef {{filename: string?, format: string}} Output */

const FORMATTED_FILE_OUTPUT_ARG_TRIGGER = "--output-";
const FORMATTED_STDOUT_ARG_TRIGGER = "--print-"
export class FormattedOutputsParser extends Parser {
    #supported_formats = null;

    constructor(...formats){
        super();
        this._state = Object.assign([], {files: false, prints: false});
        if (formats) this.#supported_formats = formats;
    }

    checkFormat(format){
        if (!format){
            throw "No format specified after " + FORMATTED_FILE_OUTPUT_ARG_TRIGGER + " or " + FORMATTED_STDOUT_ARG_TRIGGER;
        }
        if (this.#supported_formats && !this.#supported_formats.includes(format)){
            throw "Unsupported output format " + format + " ; supported formats are " + this.#supported_formats.join(", ");
        }
    }

    parse(args, i){
        const arg = args[i]
        if (arg && arg.startsWith(FORMATTED_FILE_OUTPUT_ARG_TRIGGER)){
            const format = arg.slice(FORMATTED_FILE_OUTPUT_ARG_TRIGGER.length);
            this.checkFormat(format);
            this._state.push({filename: this.getArg(args, i + 1), format});
            this._state.files = true;
            return 1;
        } else if (arg && arg.startsWith(FORMATTED_STDOUT_ARG_TRIGGER)){
            const format = arg.slice(FORMATTED_STDOUT_ARG_TRIGGER.length);
            this.checkFormat(format);
            this._state.push({filename: null, format});
            this._state.prints = true;
            return true;
        }

        return false;
    }

    getUsageDescription(){
        return "{--output-<format>} {--print-<format>}"
    }

    isStateEmpty(){
        return this._state.length > 0;
    }
}

/**
 * Added dests : outputFiles, printdata, silent, verbose
 * Added switchs : [o]uput_file, [p]rint-output, [s]silent, [v]erbose
 * @param {ArgumentsManager} argumentsManager 
 */
export function addOutputParamsBasic(argumentsManager){
    argumentsManager
        .addMultiOption(["-o", "--output-file"], {
            dest: "outputFiles",
            description: "A file to save the output to. If not specified, the output will be sent to the std output."
        })
        .addSwitch(["-p", "--print-output"], {
            dest: "printdata",
            description: "Output the result to stdout"
        })
        .addSwitch(["-s", "--silent"], {
            description: "Do not log anything besides the output. True by default if printing the output to stdout"
        })
        .addSwitch(["-v", "--verbose"], {
            description: "Always log to the standard output, even if printing the output there. For debug purposes mainly"
        })
}

/** @param {ArgumentsManager} argumentsManager */
function addLogParameter(argumentsManager){
    argumentsManager.addSwitch(["-l", "--log-data"], {
        dest: "logdata",
        description: "Use to log the processed data (in a nice and pretty format) to the std output. True by default if neither -o or -p are specified."
    })
}

/** @param {ArgumentsManager} argumentsManager */
function addFormatParameter(argumentsManager){
    argumentsManager
        .addOption("--format", {
            dest: "outputFormat",
            description: "The output format. Either json (default) or csv"
        })
        .addCustomParser(
            new FormattedOutputsParser("json", "prettyjson", "readable", "csv", "text"), 
            "formattedOutput", {}, true
        )
}

/** @param {ArgumentsManager} argumentsManager */
function addFragmentParameter(argumentsManager){
    argumentsManager.addOption(["-X", "--fragment-output"], {
        dest: "fragmentOutput",
        default: null,
        description: "Use this option to fragment the JSON output for array data into multiple files. Each file will contain at most the number of elements specified.",
        type: "number"
    })
}

/**
 * For scripts that can only output processed text.  
 * Added dests : outputFiles, printdata, silent, logdata  
 * Added switchs : [o]uput_file, [p]rint-output, [s]silent, [l]og-data  
 * @param {ArgumentsManager} argumentsManager 
 */
export function addOutputParamsText(argumentsManager){
    addOutputParamsBasic(argumentsManager);
    addLogParameter(argumentsManager);
}

/**
 * Added dests : outputFiles, printdata, silent, prettyjson, fragmentOutput, formattedOutput
 * Added switchs : [o]uput_file, [p]rint-output, [s]silent, [r]eadable-json, [X]/fragment-output  
 * @param {ArgumentsManager} argumentsManager 
 */
export function addOutputParamsJSON(argumentsManager){
    addOutputParamsBasic(argumentsManager);
    addFragmentParameter(argumentsManager);
    argumentsManager
        .addSwitch(["-r", "--readable-json"], {description: "Makes the JSON output human-readable", dest: "prettyjson"})
        .addCustomParser(new FormattedOutputsParser("json", "prettyjson", "readable"), "formattedOutput")
}

/**
 * Added dests : outputFiles, printdata, silent, outputFormat, formattedOutput, fragmentOutput
 * Added switchs : [o]uput_file, [p]rint-output, [s]silent, format, output-*, print-*, [X]/fragment-output
 * @param {ArgumentsManager} argumentsManager 
 */
export function addOutputParamsNoLog(argumentsManager){
    addOutputParamsBasic(argumentsManager);
    addFormatParameter(argumentsManager);
    addFragmentParameter(argumentsManager);
}

/**
 * Returns a function to pass to .apply    
 * Added dests : outputFiles, printdata, silent  
 * Potential dests : logdata, outputFormat, formattedOutput, fragmentOutput, 
 * Added switchs : [o]uput_file, [p]rint-output, [s]silent  
 * Potential switchs : [l]og-data, format, output-*, print-*, [X]/fragment-output  
 * @param {boolean} log 
 * @param {boolean} format 
 * @returns 
 */
export function addOutputParamsCustom(log, format, fragment){
    return argumentsManager => {
        addOutputParamsBasic(argumentsManager);
        if (log) addLogParameter(argumentsManager);
        if (format) addFormatParameter(argumentsManager);
        if (fragment) addFragmentParameter(argumentsManager);
    }
}

/**
 * Added dests : outputFormat, outputfiles, logdata, printdata, silent, fragmentOutput, formattedOutput
 * Added switchs : [o]uput-file, [p]rint-output, [s]silent, [p]rint-output, format, [X]/fragment-output output-*, print-*
 * @param {ArgumentsManager} argumentsManager 
 */
export function addOutputParams(argumentsManager){
    addOutputParamsBasic(argumentsManager);
    addLogParameter(argumentsManager);
    addFormatParameter(argumentsManager);
    addFragmentParameter(argumentsManager);
}

function addInputParams_(argumentsManager, mandatory){
    argumentsManager
        .addOption(["-i", "--input-file"], {dest: "inputfile", description: "A file containing pre-downloaded data"}, !mandatory)
}

/**
 * Dests added : inputfile
 * Added switchs : [i]nput-file
 * @param {ArgumentsManager} argumentsManager 
 */
export function addInputParams(argumentsManager){
    addInputParams_(argumentsManager, false)
}

/**
 * Dests added : inputfile
 * Added switchs : [i]nput-file (mandatory)
 * @param {ArgumentsManager} argumentsManager 
 */
export function addInputParamsMandatory(argumentsManager){
    addInputParams_(argumentsManager, true)
}

/**
 * Dests added : cache, cache_frequency
 * Added switchs : [c]ache, cache-frequency
 * @param {ArgumentsManager} argumentsManager 
 */
export function addCacheParams(argumentsManager){
    argumentsManager
        .addOption(["-c", "--cache"], {description: "File to use as cache for queries (useful is the program crashes during execution)"})
        .addOption(["--cache-frequency"], {description: "How often does the program write to cache (in number of queries)"})
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
 * Dests added : exclude_expression, filter, minEntrants, filterFiles
 * Added switchs : [R]/exclude_expression, [b]/filter, [m]in-entrants, filter-file
 * @param {ArgumentsManager} argumentsManager 
 */
export function addEventGenericFilterParams(argumentsManager){
    argumentsManager
        .addMultiOption(["-R", "--exclude_expression"], {description: "Regular expressions that will remove events they match with"})
        .addMultiOption(["-b", "--filter"], {description: "Add a word filter. Events containing one of these words will be ignored"})
        .addMultiOption(["--filter-file"], {dest: "filterFiles", description: "File containing a list of word filters (one filter per line)"})
        .addOption(["-m", "--min-entrants"], {dest: "minEntrants", type: "number", description: "Only count events with at least this number of entrants"})
}

const eventFilterParamFunctions = [
    addEventDateFilterParams,
    addEventGameFilterParams,
    addEventOnlineFilterParams,
    addEventGenericFilterParams
]

/**
 * Dests added : games, minEntrants, exclude_expression, filter, startDate, endDate, offline, filterFiles
 * Added switchs : [R]/exclude_expression, [b]/filter, [O]/offline, start-date, end-date, [g]ames, [m]in-entrants, filter-file
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
export function addEventFilterParamsExcept(...exclude){
    exclude = exclude.flat();
    return (argumentsManager) => {
        for (const f of eventFilterParamFunctions){
            if (!exclude.includes(f)) f(argumentsManager);
        }
    }
}

/**
 * Dests added : userSlugs, filename, userDataFile, filterUsers  
 * start-date, [f]ilename, [D]/user-data-file, users-list-only
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
    .addSwitch(["-U", "--users-list-only"], {
        dest: "filterUsers",
        description: "Use only the users in the list specified with -f, even if more are present in the data file specified with -D"
    })
}

function areWePrintingAnything(printdata, formattedOutput){
    return printdata || (formattedOutput && formattedOutput.prints);
}

/**
 * @param {boolean} printdata 
 * @param {boolean} verbose 
 * @param {boolean} silent 
 */
export function isSilent(printdata, silent, verbose){
    return !verbose && (silent || printdata);
}

export function isSilentFromArgs(args){
    return isSilent(args.printdata, args.silent, args.verbose);
}

export function doWePrintFromArgs(args){
    args.printdata = args.printdata || !isThereAnyOutputFile(args.outputFiles, args.formattedOutput);
    return isSilentFromArgs(args);
}

/**
 * Returns two values, indicating if we should log data, and if the program should be silent
 * @param {boolean} logdata 
 * @param {boolean} printdata 
 * @param {string[]} outputfile 
 * @param {boolean} silent 
 * @param {Output[]} formattedOutput 
 * @returns [logdata, silent, printdata]
 */
export function doWeLog(logdata, printdata, outputfile, silent, formattedOutput, verbose){
    printdata = printdata || (!isThereAnyOutputFile(outputfile, formattedOutput) && !logdata);
    return [
        logdata || (!printdata && !silent),
        isSilent(areWePrintingAnything(printdata, formattedOutput), silent, verbose),
        printdata
    ]
}

export function doWeLogFromArgs(args){
    const res = doWeLog(args.logdata, args.printdata, args.outputFiles, args.silent, args.formattedOutput, args.verbose);
    args.printdata = res[2];
    return res;
}