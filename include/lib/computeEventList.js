
import { Parser, parseArguments, argsLeft } from "@twilcynder/arguments-parser";

/**
 * @param {string[]} argList 
 * @returns 
 */
export function computeEventList(argList){
    let [list] = parseArguments(argList, new EventListParser());
    return list;
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
            case "-f":
                console.log("-f is not suported yet sorryyyyy");
                return false
            case "-t":
                {
                    if (!argsLeft(args, i, 3)){
                        throw "Argument -s usage : -s template min max"
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
}