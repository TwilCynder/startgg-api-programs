
import { Parser, parseArguments, argsLeft } from "@twilcynder/arguments-parser";

export function computeEventList(argList){
    let [list] = parseArguments(argList, new EventListParser());
    return list;
}

export class EventListParser extends Parser {
    constructor(){
        super();
        this._state = [];
    }

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
                        this._state.push(template.replace("%", i));
                    }
                    return 3;
                }
            default:
                this._state.push(arg);
        }
    }   
}
