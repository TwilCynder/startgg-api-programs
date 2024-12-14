
import { Parser, parseArguments, argsLeft, ArgumentsManager } from "@twilcynder/arguments-parser";
import { readLines, readLinesAsync, readLinesInFiles, splitWhitespace } from "./jsUtil.js";
import { extractSlug } from "./tournamentUtil.js";

/**
 * @param {string[]} argList 
 * @returns 
 */
export function computeEventList(argList){
    let [list] = parseArguments(argList, new EventListParser());
    return list;
}

/**
 * Added dests : eventsFilename
 * @param {ArgumentsManager} am 
 */
export function addFileEventListParser(am){
    am.addMultiOption("--events-file", {dest: "eventsFilenames", description: "A file to find a list of event slugs in"})
}

/**
 * Added dests : eventSlugs, eventsFilenames
 * @param {ArgumentsManager} am 
 */
export function addEventParsers(am){
    am.addCustomParser(new EventListParser, "eventSlugs")
    addFileEventListParser(am);
}

export async function readEventLists(currentList, filenames){
    let events = (await readLinesInFiles(filenames))
        .filter(ev => !!ev)
        .map(ev => {
            if (ev.includes("%")){
                let [template, min_, max_] = splitWhitespace(ev);
                let min = parseInt(min_);
                let max = parseInt(max_);
                return expandTemplate(template, min, max);
            } else {
                return ev;
            }
        })
        .flat()
        .map(ev => {
            return extractSlug(ev.trim())
        })
    return currentList.concat(events);
}

/**
 * @param {string} template 
 * @param {number} min 
 * @param {number} max 
 * @returns 
 */
export function expandTemplate(template, min, max){
    let res = []
    for (let i = min; i <= max; i++){
        res.push(template.replace(/%/g, i));
    }
    return res;
}

export class EventListParser extends Parser {
    constructor(){
        super();
        this._state = [];
    }

    /**
     * 
     * @param {string[]} args 
     * @param {number} i 
     * @returns 
     */
    parse(args, i){
        let arg = args[i];
        switch (arg){
            case "-t":
                {
                    if (!argsLeft(args, i, 3)){
                        throw "Argument -s usage : -s <template> <min> <max>"
                    }
                    let template = args[i + 1];
                    let min = parseInt(args[i + 2]);
                    let max = parseInt(args[i + 3]);
                    for (let i = min; i <= max; i++){
                        this._state.push(template.replace(/%/g, i));
                    }
                    return 3;
                }
            default:
                this._state.push(arg);
                return true;
        }
    }   

    getUsageDescription(){
        return [
            "<slug>",
            "-t <slug template> <min> <max (inclusive)>",
        ]
    }

    getUsageText(){
        return [
            "<slug>...",
            "(-t <slug template> <min> <max>)...",
        ]
    }

    getDefaultDescription(){
        return [
            "Event slug",
            "Generates an event slug for each number between min and max (inclusive), by replacing any occurence of \"%\" in the slug template",
        ]
    }
}

export class SwitchableEventListParser extends EventListParser {
    #active = false;

    /**
     * 
     * @param {string} onSwitch 
     * @param {string} offSwitch 
     * @param {boolean} defaultState 
     */
    constructor(onSwitch = "-e", offSwitch = "-E", defaultState){
        super();
        this.onSwitch = onSwitch;
        this.offSwitch = offSwitch;
        this.#active = defaultState;
    }

    parse(args, i){
        if (this.#active){
            if (args[i] == this.offSwitch){
                this.#active = false;
                return true;
            }

            return super.parse(args, i);
        } else if (args[i] == this.onSwitch){
            this.#active = true;
            return true;
        }
    }

    getUsageDescription(){
        return [
            "-e",
            "-E"
        ].concat(super.getUsageDescription());
    }

    getUsageText(){
        return [
            "[-e]",
            "[-E]"
        ].concat(super.getUsageText());
    }

    getDefaultDescription(){
        return [
            "Enables parsing arguments as slugs. If this hasn't been enabled, arguments will never be parsed as slugs.",
            "Disables parsing arguments as slugs. If this is disabled, arguments will never be parsed as slugs."
        ].concat(super.getDefaultDescription());
    }

}