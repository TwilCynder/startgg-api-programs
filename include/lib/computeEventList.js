
export function computeEventList(argList, callback){
    let argIndex = 0;
    let list = [];
    
    while(argIndex < argList.length){
        switch (argList[argIndex]){
            case "-f":
                console.log("-f is not suported yet sorryyyyy");
                return
            case "-s":
                {
                    if (argList.length < argIndex + 3 ){
                        return false
                    }
                    let template = argList[argIndex + 1];
                    let min = parseInt(argList[argIndex + 2]);
                    let max = parseInt(argList[argIndex + 3]);
                    console.log(template, min, max)
                    for (let i = min; i <= max; i++){
                        list.push(template.replace("%", i));
                    }
                    argIndex += 3;
                }
                break;
            default:
                

                list.push(argList[argIndex]);
        }
    
        argIndex++;
    }

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
            case "-s":
                {
                    if (!argsLeft(args, i, 3)){
                        throw "Argument -s usage : -s template min max"
                    }
                    let template = args[i + 1];
                    let min = parseInt(args[i + 2]);
                    let max = parseInt(args[i + 3]);
                    console.log(template, min, max);
                    for (let i = min; i <= max; i++){
                        list.push(template.replace("%", i));
                    }
                    return 3;
                }
            default:
                list.push(arg);
        }
    }   
}
